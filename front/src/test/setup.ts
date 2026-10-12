import '@testing-library/jest-dom/vitest';
import { Blob as BlobDoNode, File as FileDoNode } from 'node:buffer';
import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetDb } from '@/mocks/db';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  toast.dismiss(); // os toasts são globais e vazariam para o teste seguinte
  localStorage.clear();
  server.resetHandlers();
  resetDb();
});
afterAll(() => server.close());

// jsdom não implementa estas APIs, que o Radix (menus, folhas) usa.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
Element.prototype.scrollIntoView ??= () => {};
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.matchMedia ??= ((consulta: string) => ({
  matches: false,
  media: consulta,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

// O File/FormData do jsdom e o fetch do Node não se entendem (o nome do arquivo some no multipart).
// Nos testes usamos as classes do próprio Node, as mesmas que o fetch e o MSW enxergam.
const FormDataDoNode = (await new Response(new URLSearchParams()).formData()).constructor as typeof FormData;
// O jsdom do Vitest troca o Request por uma versão que converte File do jsdom e perde o nome do arquivo.
// O Request original do Node é o protótipo dela.
const RequestDoNode = Object.getPrototypeOf(globalThis.Request) as typeof Request;
Object.assign(globalThis, { Blob: BlobDoNode, File: FileDoNode, FormData: FormDataDoNode, Request: RequestDoNode });

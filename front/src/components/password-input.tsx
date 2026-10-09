import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'>>(
  function PasswordInput(props, ref) {
    const [visivel, setVisivel] = useState(false);
    const Icone = visivel ? EyeOff : Eye;

    return (
      <div className="relative">
        <Input ref={ref} type={visivel ? 'text' : 'password'} className="pr-12" {...props} />
        <button
          type="button"
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icone aria-hidden="true" className="size-5" />
        </button>
      </div>
    );
  },
);

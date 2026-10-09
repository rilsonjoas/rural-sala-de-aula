import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TODOS_OS_SEMESTRES = 'todos';

type Props = { semestres: string[]; valor: string; onChange: (valor: string) => void };

export function SemestreSelect({ semestres, valor, onChange }: Props) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger aria-label="Semestre" className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {semestres.map((semestre) => (
          <SelectItem key={semestre} value={semestre}>
            Semestre {semestre}
          </SelectItem>
        ))}
        <SelectItem value={TODOS_OS_SEMESTRES}>Todos os semestres</SelectItem>
      </SelectContent>
    </Select>
  );
}

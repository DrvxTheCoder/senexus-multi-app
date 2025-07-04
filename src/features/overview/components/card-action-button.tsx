import { Card, CardContent } from '@/components/ui/card';

type CardActionButtonProps = {
  title: string;
  action: React.ReactNode;
};

export const CardActionButton = ({ title, action }: CardActionButtonProps) => (
  <Card className='group hover:bg-muted-foreground/10 flex h-fit w-full items-center rounded-2xl py-3 duration-300 ease-in-out'>
    <CardContent className='flex w-full flex-row items-center justify-between gap-1 py-0'>
      <div className='flex flex-row items-center gap-1'>
        <div className='flex flex-col gap-1'>
          <p className='mt-1 text-sm font-semibold'>{title}</p>
        </div>
      </div>
      <div className='text-primary group-hover:bg-muted-foreground/25 flex h-fit w-fit cursor-pointer items-center justify-center rounded-full border p-3 transition-colors'>
        {action}
      </div>
    </CardContent>
  </Card>
);

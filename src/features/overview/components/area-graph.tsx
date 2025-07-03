'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const areaChartData = [
  { month: 'Janvier', cdi: 142, cdd: 78 },
  { month: 'Février', cdi: 148, cdd: 82 },
  { month: 'Mars', cdi: 151, cdd: 76 },
  { month: 'Avril', cdi: 154, cdd: 89 },
  { month: 'Mai', cdi: 156, cdd: 95 },
  { month: 'Juin', cdi: 156, cdd: 98 }
];

const areaChartConfig = {
  contrats: {
    label: 'Contrats'
  },
  cdi: {
    label: 'CDI',
    color: 'var(--primary)'
  },
  cdd: {
    label: 'CDD',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Évolution des Contrats</CardTitle>
        <CardDescription>
          Répartition CDI/CDD sur les 6 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={areaChartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={areaChartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillCDI' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-cdi)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-cdi)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillCDD' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-cdd)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-cdd)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='cdd'
              type='natural'
              fill='url(#fillCDD)'
              stroke='var(--color-cdd)'
              stackId='a'
            />
            <Area
              dataKey='cdi'
              type='natural'
              fill='url(#fillCDI)'
              stroke='var(--color-cdi)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              Croissance de 6.2% ce mois{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Janvier - Juin 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

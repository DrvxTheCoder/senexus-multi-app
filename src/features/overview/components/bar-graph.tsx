'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'Un graphique à barres interactif';

const chartData = [
  {
    date: '2024-01-01',
    touba_gaz_mbao: 82,
    touba_gaz_bouteilles: 61,
    touba_oil_hydro: 58
  },
  {
    date: '2024-01-15',
    touba_gaz_mbao: 50,
    touba_gaz_bouteilles: 62,
    touba_oil_hydro: 45
  },
  {
    date: '2024-02-01',
    touba_gaz_mbao: 85,
    touba_gaz_bouteilles: 63,
    touba_oil_hydro: 50
  },
  {
    date: '2024-02-15',
    touba_gaz_mbao: 96,
    touba_gaz_bouteilles: 64,
    touba_oil_hydro: 55
  },
  {
    date: '2024-03-01',
    touba_gaz_mbao: 34,
    touba_gaz_bouteilles: 65,
    touba_oil_hydro: 60
  },
  {
    date: '2024-03-15',
    touba_gaz_mbao: 45,
    touba_gaz_bouteilles: 66,
    touba_oil_hydro: 65
  },
  {
    date: '2024-04-01',
    touba_gaz_mbao: 68,
    touba_gaz_bouteilles: 67,
    touba_oil_hydro: 60
  },
  {
    date: '2024-04-15',
    touba_gaz_mbao: 30,
    touba_gaz_bouteilles: 67,
    touba_oil_hydro: 60
  },
  {
    date: '2024-05-01',
    touba_gaz_mbao: 24,
    touba_gaz_bouteilles: 67,
    touba_oil_hydro: 60
  },
  {
    date: '2024-05-15',
    touba_gaz_mbao: 45,
    touba_gaz_bouteilles: 67,
    touba_oil_hydro: 62
  },
  {
    date: '2024-06-01',
    touba_gaz_mbao: 78,
    touba_gaz_bouteilles: 67,
    touba_oil_hydro: 64
  }
];

const chartConfig = {
  employees: {
    label: 'Employés'
  },
  touba_gaz_mbao: {
    label: 'TGM',
    color: 'var(--primary)'
  },
  touba_gaz_bouteilles: {
    label: 'TGB',
    color: 'var(--primary)'
  },
  touba_oil_hydro: {
    label: 'TOH',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('touba_gaz_mbao');

  const total = React.useMemo(
    () => ({
      touba_gaz_mbao: chartData.reduce(
        (acc, curr) => acc + curr.touba_gaz_mbao,
        0
      ),
      touba_gaz_bouteilles: chartData.reduce(
        (acc, curr) => acc + curr.touba_gaz_bouteilles,
        0
      )
    }),
    []
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Card className='@container/card h-full pt-0'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Évolution des Effectifs</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Nombre d&apos;employés par entité sur 6 mois
            </span>
            <span className='@[540px]/card:hidden'>6 derniers mois</span>
          </CardDescription>
        </div>
        <div className='flex'>
          {['touba_gaz_mbao', 'touba_gaz_bouteilles', 'touba_oil_hydro'].map(
            (key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                  onClick={() => setActiveChart(chart)}
                >
                  <span className='text-muted-foreground text-xs'>
                    {chartConfig[chart].label}
                  </span>
                  <span className='text-lg leading-none font-bold sm:text-3xl'>
                    {
                      chartData[chartData.length - 1][
                        key as keyof (typeof chartData)[0]
                      ]
                    }
                  </span>
                </button>
              );
            }
          )}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[200px]'
                  nameKey='employees'
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('fr-FR', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBar)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

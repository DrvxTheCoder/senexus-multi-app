'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardAction,
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
import { Badge } from '@/components/ui/badge';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--primary)' },
  { browser: 'safari', visitors: 200, fill: 'var(--primary-light)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--primary-lighter)' },
  { browser: 'edge', visitors: 173, fill: 'var(--primary-dark)' },
  { browser: 'other', visitors: 190, fill: 'var(--primary-darker)' }
];

const pieChartData = [
  { department: 'production', employees: 128, fill: 'var(--primary)' },
  { department: 'vente', employees: 89, fill: 'var(--primary-light)' },
  { department: 'logistique', employees: 67, fill: 'var(--primary-lighter)' },
  { department: 'administration', employees: 34, fill: 'var(--primary-dark)' },
  { department: 'maintenance', employees: 24, fill: 'var(--primary-darker)' }
];

const pieChartConfig = {
  employees: {
    label: 'Employés'
  },
  production: {
    label: 'Production',
    color: 'var(--primary)'
  },
  vente: {
    label: 'Vente',
    color: 'var(--primary)'
  },
  logistique: {
    label: 'Logistique',
    color: 'var(--primary)'
  },
  administration: {
    label: 'Administration',
    color: 'var(--primary)'
  },
  maintenance: {
    label: 'Maintenance',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  const totalEmployees = React.useMemo(() => {
    return pieChartData.reduce((acc, curr) => acc + curr.employees, 0);
  }, []);

  return (
    <Card className='@container/card h-full'>
      <CardHeader>
        <CardTitle>
          Répartition par Département
        </CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>Distribution des employés par département</span>
          <span className='@[540px]/card:hidden'>Par département</span>
        </CardDescription>
        <CardAction>
          <Badge variant='outline'>
            <IconTrendingUp />
            {((pieChartData[0].employees / totalEmployees) * 100).toFixed(1)}%{' '}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={pieChartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {['production', 'vente', 'logistique', 'administration', 'maintenance'].map(
                (department, index) => (
                  <linearGradient
                    key={department}
                    id={`fill${department}`}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop
                      offset='0%'
                      stopColor='var(--primary)'
                      stopOpacity={1 - index * 0.15}
                    />
                    <stop
                      offset='100%'
                      stopColor='var(--primary)'
                      stopOpacity={0.8 - index * 0.15}
                    />
                  </linearGradient>
                )
              )}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={pieChartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.department})`
              }))}
              dataKey='employees'
              nameKey='department'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalEmployees.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Employés
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='text-muted-foreground leading-none'>
          Basé sur les données de Janvier - Juin 2024
        </div>
      </CardFooter>
    </Card>
  );
}

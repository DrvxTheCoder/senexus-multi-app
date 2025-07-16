import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
  CardContent
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CardActionButton } from '@/features/overview/components/card-action-button';
import {
  IconUsers,
  IconBuildingFactory2,
  IconFileText,
  IconUserExclamation,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCalendarEvent,
  IconUserOff,
  IconBeach,
  IconUserPlus,
  IconBuildingPlus,
  IconFileTextSpark,
  IconFilePencil,
  IconBoltFilled,
  IconExternalLink,
  IconEye
} from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react';
import { SpinnerCircular } from 'spinners-react';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4 pb-32'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {`Vue d'ensemble`}
          </h2>
        </div>

        {/* Alert Banners */}
        <SpinnerCircular
          size={'2rem'}
          color='var(--accent-foreground)'
          secondaryColor='var(--secondary)'
          thickness={180}
        />
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <Card className='text-accent-foreground flex flex-row items-center justify-between pr-6'>
            <CardHeader className='w-full pb-3'>
              <div className='flex items-center gap-2'>
                <IconAlertTriangle className='text-destructive h-4 w-4' />
                <CardTitle className='text-destructive text-sm'>
                  Contrats Expirant
                </CardTitle>
              </div>
              <CardDescription className=''>
                7 contrats expirent dans les 30 prochains jours
              </CardDescription>
            </CardHeader>
            <Link href={'#'}>
              <Button size={'sm'} variant={'outline'}>
                <span className='hidden md:block'>Afficher</span>
                <IconEye className='h-4 w-4 md:ml-2' />
              </Button>
            </Link>
          </Card>

          <Card className='flex flex-row items-center justify-between pr-6'>
            <CardHeader className='w-full pb-3'>
              <div className='flex items-center gap-2'>
                <IconCalendarEvent className='h-4 w-4' />
                <CardTitle className='text-sm'>Demandes de Congé</CardTitle>
              </div>
              <CardDescription className='font-medium'>
                5 demandes en attente d&apos;approbation
              </CardDescription>
            </CardHeader>
            <Link href={'#'}>
              <Button size={'sm'} variant={'outline'}>
                <span className='hidden md:block'>Voir les congés</span>
                <IconExternalLink className='h-4 w-4 md:ml-2' />
              </Button>
            </Link>
          </Card>

          <Card className='flex flex-row items-center justify-between pr-6'>
            <CardHeader className='w-full pb-3'>
              <div className='flex items-center gap-2'>
                <IconUserOff className='h-4 w-4' />
                <CardTitle className='text-sm'>Absences du Jour</CardTitle>
              </div>
              <CardDescription className='font-medium'>
                12 employés absents • 8 en congé
              </CardDescription>
            </CardHeader>
            <Link href={'#'}>
              <Button size={'sm'} variant={'outline'}>
                <span className='hidden md:block'>Voir les absences</span>
                <IconExternalLink className='h-4 w-4 md:ml-2' />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Employés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                342
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +8.2%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                <IconUsers className='size-4' />
                Croissance ce mois
              </div>
              <div className='text-muted-foreground'>
                12 nouveaux recrutements
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Entités Clientes</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                24
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +2
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                <IconBuildingFactory2 className='size-4' />
                Nouveaux clients
              </div>
              <div className='text-muted-foreground'>
                Expansion du portefeuille
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Contrats Actifs</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                298
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +5.1%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                <IconFileText className='size-4' />
                Taux de rétention élevé
              </div>
              <div className='text-muted-foreground'>
                CDI: 156 • CDD: 98 • Stages: 44
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Alertes Contrats</CardDescription>
              <CardTitle className='text-destructive text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                18
              </CardTitle>
              <CardAction>
                <Badge variant='outline' className=''>
                  <IconAlertTriangle />
                  Urgent
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-destructive line-clamp-1 flex gap-2 font-medium'>
                <IconUserExclamation className='size-4' />
                Nécessite attention
              </div>
              <div className='text-muted-foreground'>
                Contrats à renouveler bientôt
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-7'>
          {/* Quick actions / Actions rapide */}
          <div className='col-span-4 md:col-span-1'>
            <div className='flex h-fit flex-col items-center justify-between gap-2 py-2'>
              <div className='flex w-full flex-row items-center justify-between justify-items-start px-3 pb-3'>
                <div className='text-muted-foreground text-sm font-semibold'>
                  Actions Rapides
                </div>
                <IconBoltFilled className='text-muted-foreground size-4' />
              </div>

              <CardActionButton
                title='Ajouter un employé'
                action={<IconUserPlus className='size-4' />}
              />
              <CardActionButton
                title='Nouveau client'
                action={<IconBuildingPlus className='size-4' />}
              />
              <CardActionButton
                title='Modifier un contrat'
                action={<IconFilePencil className='size-4' />}
              />
            </div>
          </div>
          {/* Bar chart and Activity Stats */}
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-2'>{pie_stats}</div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
        </div>
      </div>
    </PageContainer>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

const hrActivitiesData = [
  // {
  //   name: 'Mamadou Diallo',
  //   action: 'Contrat CDI signé',
  //   entity: 'Touba Gaz Mbao',
  //   avatar: '/assets/img/placeholders/profile-male.jpg',
  //   fallback: 'MD',
  //   status: 'Confirmé',
  //   time: 'Il y a 2h'
  // },
  {
    name: 'Aminata Sow',
    action: 'Congé approuvé',
    entity: 'Touba Gaz Bouteilles',
    avatar: '/assets/img/placeholders/profile-female.jpg',
    fallback: 'AS',
    status: '5 jours',
    time: 'Il y a 4h'
  },
  {
    name: 'Ousmane Ba',
    action: 'Fin de contrat CDD',
    entity: 'Touba Oil Hydro',
    avatar: '/assets/img/placeholders/profile-male.jpg',
    fallback: 'OB',
    status: 'À renouveler',
    time: 'Il y a 6h'
  },
  {
    name: 'Fatou Ndiaye',
    action: 'Nouveau recrutement',
    entity: 'Touba Gaz Ngabou',
    avatar: '/assets/img/placeholders/profile-female.jpg',
    status: 'En cours',
    time: 'Hier'
  },
  {
    name: 'Cheikh Sy',
    action: 'Formation complétée',
    entity: 'Touba Gaz Mbao',
    avatar: '/assets/img/placeholders/profile-male.jpg',
    fallback: 'CS',
    status: 'Certifié',
    time: 'Hier'
  }
];

export function RecentSales() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Activités Récentes</CardTitle>
        <CardDescription>Dernières actions effectuées ce mois.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {hrActivitiesData.map((activity, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={activity.avatar} alt='Avatar' />
                <AvatarFallback>{activity.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{activity.name}</p>
                <p className='text-muted-foreground text-sm'>
                  {activity.action} • {activity.entity}
                </p>
                <p className='text-xs text-muted-foreground'>{activity.time}</p>
              </div>
              <div className='ml-auto text-right'>
                <div className='text-sm font-medium'>{activity.status}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
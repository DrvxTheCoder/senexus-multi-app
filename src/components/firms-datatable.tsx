'use client';

import { useState } from 'react';
import {
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Firm {
  id: string;
  name: string;
  type: string;
  description: string | null;
  logo: string | null;
  theme_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  senexus_group_id: string;
}

interface FirmsDataTableProps {
  data: Firm[];
  onView: (firm: Firm) => void;
  onEdit?: (firmId: string) => void;
  onDelete?: (firmId: string) => void;
}

type SortField = 'name' | 'type' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function FirmsDataTable({ data, onView, onEdit, onDelete }: FirmsDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <span className="flex items-center gap-2">
        {children}
        <ArrowUpDown className={cn(
          "h-4 w-4 transition-all",
          sortField === field ? "opacity-100" : "opacity-50"
        )} />
      </span>
    </Button>
  );

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune firme trouvée</h3>
        <p className="text-muted-foreground">
          Aucune firme ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <SortButton field="name">Nom</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="type">Type</SortButton>
            </TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden lg:table-cell">
              <SortButton field="created_at">Créée le</SortButton>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((firm) => (
            <TableRow key={firm.id} className="group">
              <TableCell>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ 
                    backgroundColor: firm.theme_color ? `${firm.theme_color}20` : '#f1f5f9',
                    color: firm.theme_color || '#64748b'
                  }}
                >
                  {firm.logo ? (
                    <img 
                      src={firm.logo} 
                      alt={`${firm.name} logo`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-icon');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'block';
                          }
                        }
                      }}
                    />
                  ) : null}
                  <Building2 className={`fallback-icon h-4 w-4 ${firm.logo ? 'hidden' : 'block'}`} />
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{firm.name}</div>
                  <div className="text-sm text-muted-foreground md:hidden">
                    {firm.type}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className="text-xs">
                  {firm.type}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-xs">
                <div className="truncate text-sm text-muted-foreground">
                  {firm.description || 'Aucune description'}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {new Date(firm.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(firm)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    {onEdit && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(firm.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete(firm.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
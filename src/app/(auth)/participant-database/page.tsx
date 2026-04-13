"use client";

import { useState, FormEvent, ChangeEvent, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Undo, Edit, Eye, Filter, Info, X, ArrowLeft } from "lucide-react";
import { useEvaluationContext } from '@/contexts/EvaluationContext';
import { Ethnicity } from '@/lib/types';
import StatisticsTable from "@/components/charts/StatisticsTable";
import { useRouter } from "next/navigation";

// Definición de tipos
type FilterType = 'category' | 'evaluations' | 'profile' | 'ageMin' | 'ageMax' | 'ethnicity';

type Profile = 'MULT_Express' | 'MULT_Restringido' | 'MULT_5Componentes' | 'MULT_Completo';

type Category = {
  id: string;
  name: string;
  description: string;
  created_at?: string;
};

type Filters = {
  category: string;
  evaluations: string[];
  profile: Profile | '';
  ageMin: number | null;
  ageMax: number | null;
  ethnicity: Ethnicity | '';
};


type AgeErrors = {
  min: string;
  max: string;
};

export default function AdvancedFilters() {
  const { evaluationRecords, fetchRecords, isLoadingRecords } = useEvaluationContext();
  const [stats, setStats] = useState<any | null>(null);

  const [filters, setFilters] = useState<Filters>({
    category: '',
    evaluations: [],
    profile: '',
    ageMin: null,
    ageMax: null,
    ethnicity: ''
  });


  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ageErrors, setAgeErrors] = useState<AgeErrors>({ min: '', max: '' });
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);

  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const router = useRouter();


  // Cargar solo evaluaciones completadas al montar el componente
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Obtener categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('/api/categories');

        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }

        const categoriesData = await response.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const profileLabels: Record<Profile, string> = {
    'MULT_Express': 'MULT_Express',
    'MULT_Restringido': 'MULT_Restringido',
    'MULT_5Componentes': 'MULT_5Componentes',
    'MULT_Completo': 'MULT_Completo'
  };

  const ethnicityLabels: Record<Ethnicity, string> = {
    [Ethnicity.ASIATICO]: 'Asiático',
    [Ethnicity.AFROMEAMERICANO]: 'Afroamericano',
    [Ethnicity.CAUSASICO_HISPANO]: 'Caucásico Hispano'
  };

  // Filtrar solo evaluaciones completadas
  const completedEvaluations = useMemo(() => {
    return evaluationRecords.filter(record => record.status === "Completada" && !record.evaluation_mode?.startsWith("2C"));
  }, [evaluationRecords]);

  // Validar rango de edad
  const validateAgeRange = (): boolean => {
    const errors: AgeErrors = { min: '', max: '' };
    let isValid = true;

    if (filters.ageMin != null && (filters.ageMin < 0 || filters.ageMin > 100)) {
      errors.min = 'La edad debe estar entre 0 y 100 años';
      isValid = false;
    }

    if (filters.ageMax != null && (filters.ageMax < 0 || filters.ageMax > 100)) {
      errors.max = 'La edad debe estar entre 0 y 100 años';
      isValid = false;
    }

    if (filters.ageMin != null && filters.ageMax != null && filters.ageMin > filters.ageMax) {
      errors.min = 'La edad mínima no puede ser mayor que la máxima';
      errors.max = 'La edad máxima no puede ser menor que la mínima';
      isValid = false;
    }

    setAgeErrors(errors);
    return isValid;
  };


  // Manejar cambios en los filtros
  const handleFilterChange = (filterType: FilterType, value: string | number | string[] | null) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Manejar checkboxes para evaluaciones individuales
  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      evaluations: checked
        ? [...prev.evaluations, value]
        : prev.evaluations.filter(item => item !== value)
    }));
  };

  // Seleccionar/deseleccionar todas las evaluaciones
  const handleSelectAllEvaluations = (selectAll: boolean) => {
    if (selectAll) {
      handleFilterChange('evaluations', filteredEvaluations.map(evaluation => evaluation.id));
    } else {
      handleFilterChange('evaluations', []);
    }
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Restablecer filtros
  const handleReset = () => {
    setFilters({
      category: '',
      evaluations: [],
      profile: '',
      ageMin: 18,
      ageMax: 65,
      ethnicity: ''
    });
    setSearchTerm('');
    setAgeErrors({ min: '', max: '' });
  };

  const handleApplyFilters = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateAgeRange()) {
      alert("Por favor, corrige los errores en el rango de edad antes de aplicar los filtros.");
      return;
    }

    // validar: si no hay categoría y no hay evaluaciones seleccionadas → ERROR
    if (!filters.category && filters.evaluations.length === 0) {
      alert("Debes seleccionar una categoría o evaluaciones individuales.");
      return;
    }

    try {
      setIsApplyingFilters(true);

      const response = await fetch("/api/evaluations/filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: filters.category || null,
          evaluations: filters.category ? [] : filters.evaluations,
          profile: filters.profile || null,
          ageMin: filters.ageMin,
          ageMax: filters.ageMax,
          ethnicity: filters.ethnicity || null,
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Error al aplicar filtros");
        return;
      }

      console.log(data.statistics)
      setStats(data.statistics);

      setFilteredResults(data.records);

      console.log("RESULTADOS FILTRADOS:", data.records);
    } catch (error) {
      console.error("Error aplicando filtros:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  };


  // Evaluaciones filtradas por búsqueda
  const filteredEvaluations = completedEvaluations.filter(evaluation => {
    const participantName = `${evaluation.participantData?.first_name || ''} ${evaluation.participantData?.last_name || ''}`.toLowerCase();
    const evaluationId = evaluation.id.toLowerCase();

    return participantName.includes(searchTerm.toLowerCase()) ||
      evaluationId.includes(searchTerm.toLowerCase()) ||
      (evaluation.form_type || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">

            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="
        mb-4 print:hidden 
        border-pink-400 
        text-pink-600 
        hover:bg-pink-500 
        hover:text-white 
        hover:border-pink-600
        transition-all duration-200
    "
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>

      {/* Header Card */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Filter className="mr-3 h-8 w-8 text-primary" /> Base de datos de sujetos
          </CardTitle>
          <CardDescription>
            Utiliza los filtros para encontrar exactamente lo que necesitas en las evaluaciones completadas.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters Card */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Opciones de Filtrado</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Filtrando sobre {completedEvaluations.length} evaluaciones completadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyFilters} className="space-y-6">
            {/* Categoría */}
            <div className="filter-section border-b pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Categoría</h3>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Cargando categorías...</span>
                </div>
              ) : (
                <select
                  value={filters.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>

                  ))}
                </select>
              )}
            </div>

            {/* Evaluaciones Individuales */}
            <div className="filter-section border-b pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Evaluaciones Completadas</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar evaluación por nombre, ID o tipo..."
                    className="pl-10 pr-8"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-muted">
                  {isLoadingRecords ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Cargando evaluaciones...</span>
                    </div>
                  ) : filteredEvaluations.length > 0 ? (
                    filteredEvaluations.map(evaluation => {
                      const participantName = `${evaluation.participantData?.first_name || ''} ${evaluation.participantData?.last_name || ''}`.trim();
                      return (
                        <div key={evaluation.id} className="evaluation-item flex items-center p-2 rounded hover:bg-secondary transition-colors">
                          <input
                            type="checkbox"
                            id={`eval-${evaluation.id}`}
                            checked={filters.evaluations.includes(evaluation.id)}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleCheckboxChange(evaluation.id, e.target.checked)
                            }
                            className="mr-3"
                          />
                          <label htmlFor={`eval-${evaluation.id}`} className="cursor-pointer flex-1">
                            <div className="font-medium">{participantName || evaluation.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {evaluation.form_type} • {evaluation.evaluation_mode} • {evaluation.participantData?.calculated_age ? `${evaluation.participantData.calculated_age.toFixed(1)} años` : 'Sin edad'}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {searchTerm
                        ? "No se encontraron evaluaciones que coincidan con tu búsqueda"
                        : "No hay evaluaciones completadas disponibles"
                      }
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAllEvaluations(true)}
                    disabled={isLoadingRecords || filteredEvaluations.length === 0}
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAllEvaluations(false)}
                    disabled={isLoadingRecords || filters.evaluations.length === 0}
                  >
                    Deseleccionar Todas
                  </Button>
                </div>
              </div>
            </div>

            {/* Perfil - OPCIÓN ÚNICA */}
            <div className="filter-section border-b pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Perfil de Evaluación</h3>
              <select
                value={filters.profile}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('profile', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Todos los perfiles</option>
                {(Object.entries(profileLabels) as [Profile, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de Edad */}
            <div className="filter-section border-b pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Rango de Edad</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="ageMinInput" className="block text-sm font-medium mb-2">
                      Edad Mínima
                    </label>

                    <Input
                      type="number"
                      id="ageMinInput"
                      min="0"
                      max="100"
                      value={filters.ageMin ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('ageMin', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className={ageErrors.min ? 'border-destructive' : ''}
                    />

                    {ageErrors.min && (
                      <div className="text-destructive text-sm mt-1">{ageErrors.min}</div>
                    )}

                  </div>
                  <div className="flex-1">
                    <label htmlFor="ageMaxInput" className="block text-sm font-medium mb-2">
                      Edad Máxima
                    </label>

                    <Input
                      type="number"
                      id="ageMaxInput"
                      min="0"
                      max="100"
                      value={filters.ageMax ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('ageMax', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className={ageErrors.max ? 'border-destructive' : ''}
                    />
                    {ageErrors.max && (
                      <div className="text-destructive text-sm mt-1">{ageErrors.max}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Info className="h-4 w-4 mr-1 text-primary" />
                  Ingresa valores entre 0 y 100 años. La edad mínima debe ser menor o igual a la máxima.
                </div>
              </div>
            </div>

            {/* Etnia - OPCIÓN ÚNICA */}
            <div className="filter-section border-b pb-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Etnia</h3>
              <select
                value={filters.ethnicity}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('ethnicity', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Todas las etnias</option>
                {(Object.entries(ethnicityLabels) as [Ethnicity, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="secondary" onClick={handleReset}>
                <Undo className="mr-2 h-4 w-4" /> Restablecer Filtros
              </Button>
              <div className="flex space-x-2">

                <Button type="submit" disabled={isLoadingRecords}>
                  <Search className="mr-2 h-4 w-4" /> Aplicar Filtros
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {filteredResults.length > 0 && (
        <Card className="shadow-xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl">
              Resultados filtrados ({filteredResults.length})
            </CardTitle>
            <CardDescription>
              Estos son los registros que cumplen con los filtros aplicados.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto border rounded-md p-3 bg-muted">
              {filteredResults.map((evaluation) => (
                <div key={evaluation.id} className="p-3 rounded bg-white shadow flex flex-col">
                  <span className="font-bold text-primary">
                    {evaluation.p_first_name} {evaluation.p_last_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ID: {evaluation.id}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Edad: {evaluation.p_calculated_age ?? "Sin edad"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Perfil: {evaluation.evaluation_mode}
                  </span>

                  {evaluation.categories?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {evaluation.categories.map((c: any) => (
                        <Badge key={c.id} variant="secondary">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Estadísticas</h2>

          {/* Aquí integras tu componente */}
          <StatisticsTable statistics={stats} />
        </div>
      )}


    </div>
  );
}
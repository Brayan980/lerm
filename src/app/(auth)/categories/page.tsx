"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Edit, Trash2, ChevronLeft, ChevronRight, Tags, CirclePlus, ClipboardCheck, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Tipo para las categorías
interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null);
    const router = useRouter();


  const recordsPerPage = 10;

  // Estados para el formulario de creación
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategories(data);
      setTotalRecords(data.length);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear categoría');
      }

      const result = await response.json();

      toast({
        title: "Éxito",
        description: "Categoría creada correctamente",
      });

      // Limpiar formulario y recargar categorías
      setNewCategory({ name: "", description: "" });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.description.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEditing(true);
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editingCategory.name,
          description: editingCategory.description
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar categoría');
      }

      const result = await response.json();

      toast({
        title: "Éxito",
        description: "Categoría actualizada correctamente",
      });

      // Cerrar modal y recargar categorías
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

const handleDeleteCategory = async (id: string) => {

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar categoría');
      }

      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory({ ...category });
  };

  const closeEditModal = () => {
    setEditingCategory(null);
  };

  const handleRefresh = async () => {
    await fetchCategories();
    toast({
      title: "Lista actualizada",
      description: "Las categorías se han actualizado correctamente.",
    });
  };

  // Filtrado del lado del cliente
  const filteredCategories = useMemo(() => {
    return categories
      .filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [categories, searchTerm]);

  // Paginación
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredCategories.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Generar los números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator"]}>
      <div className="space-y-8">

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

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center">
              <Tags className="mr-3 h-8 w-8 text-primary" />
              Gestión de Categorías
            </CardTitle>
            <CardDescription>
              Crea y gestiona las categorías para organizar tu contenido.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Formulario de creación */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Crear Nueva Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium mb-2 block">
                  Nombre de la categoría *
                </label>
                <Input
                  id="name"
                  placeholder="Ej: Ejercicios Cardiovasculares"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-medium mb-2 block">
                  Descripción *
                </label>
                <Input
                  id="description"
                  placeholder="Ej: Actividades para mejorar la salud cardiovascular"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategory.name.trim() || !newCategory.description.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creando..." : "Crear Categoría"}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de categorías */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl">
                Lista de Categorías
                {totalRecords > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totalRecords} {totalRecords === 1 ? 'categoría' : 'categorías'} total)
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar categorías..."
                    className="pl-8 w-full sm:w-[250px] lg:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Cargando categorías...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.length > 0 ? (
                      paginatedCategories.map((category) => {

                        return (
                          <TableRow key={category.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell>
                              {category.description}
                            </TableCell>
                            <TableCell className="text-right space-x-2">

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                                asChild
                              >
                                <Link href={`/categories/assign/${category.id}`}>
                                  <CirclePlus className="w-4 h-4 mr-1" />
                                  Incluir evaluaciones
                                </Link>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                                onClick={() => openEditModal(category)}
                              >
                                <Edit className="mr-1 h-4 w-4" /> Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteData({ id: category.id, name: category.name })}
                              >
                                <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {categories.length === 0
                            ? "No hay categorías creadas. Comienza creando una nueva categoría."
                            : "No hay categorías que coincidan con su búsqueda."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={`page-${page}`}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          disabled={isLoading}
                        >
                          {page}
                        </Button>
                      )
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center">
                  {filteredCategories.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * recordsPerPage) + 1} a{" "}
                      {Math.min(currentPage * recordsPerPage, filteredCategories.length)} de {filteredCategories.length} categorías
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de edición */}
        <Dialog open={!!editingCategory} onOpenChange={closeEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="mr-2 h-5 w-5" />
                Editar Categoría
              </DialogTitle>
              <DialogDescription>
                Modifica los datos de la categoría. Haz clic en guardar cuando termines.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="edit-name"
                  value={editingCategory?.name || ""}
                  onChange={(e) => setEditingCategory(prev =>
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                  className="col-span-3"
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Descripción *
                </Label>
                <Input
                  id="edit-description"
                  value={editingCategory?.description || ""}
                  onChange={(e) => setEditingCategory(prev =>
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  className="col-span-3"
                  placeholder="Descripción de la categoría"
                />
              </div>
              {editingCategory?.created_at && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm text-muted-foreground">
                    Creada
                  </Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {format(new Date(editingCategory.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeEditModal}
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={isEditing || !editingCategory?.name?.trim() || !editingCategory?.description?.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal bonito para confirmar eliminación */}
        <Dialog open={!!deleteData} onOpenChange={() => setDeleteData(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <Trash2 className="mr-2 h-5 w-5" /> Eliminar Categoría
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar la
                categoría <span className="font-semibold text-foreground">"{deleteData?.name}"</span>?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg my-4">
              <p className="text-sm text-red-700 flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Al eliminar esta categoría, se perderá toda la relación con evaluaciones asignadas.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteData(null)}
              >
                Cancelar
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteData) {
                    handleDeleteCategory(deleteData.id);
                    setDeleteData(null);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sí, eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    </AuthWrapper>


  );
}
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function TermsSections() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left hover:no-underline">
          Autorización para el tratamiento de datos personales
        </AccordionTrigger>
        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            En cumplimiento de las disposiciones de la Ley 1581 de 2012 de habeas data, el decreto reglamentario 1377 de 2013, la política de protección de datos y las demás normas que lo adicionen o modifiquen, autorizo como titular de los datos personales y/o representante legal del menor de edad a la Corporación Universitaria del Caribe- CECAR (programa de ciencias del deporte y la actividad física; Laboratorio de Evaluación del Rendimiento Morfofuncional – LERM y grupo de investigación Dimensiones Humanas), como responsable del tratamiento de datos personales para que use, recolecte, conserve, custodie los datos suministrados de naturaleza pública, privada, semiprivada y sensible, y que sobre estos últimos se me ha informado que me encuentro facultado para abstenerme de entregar por su naturaleza, tales como fotografía, videos, la pertenencia a un grupo étnico, datos relacionados con la salud o cualquier otro dato que se relacione con la intimidad personal, entre otros.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left hover:no-underline">
          Detalles sobre evaluación física
        </AccordionTrigger>
        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
          <p>En este sentido, de manera libre, voluntaria y espontánea, por medio del presente escrito manifiesto:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Que he sido informado sobre los propósitos, objetivos, procedimientos de intervención y evaluación que se llevarán a cabo, así como los posibles riesgos que esta pueda generar.</li>
            <li>Que autorizo a el Laboratorio De Evaluación Del Rendimiento Morfofuncional, a practicar las pruebas antropométricas con las condiciones que se requieran (incluyendo la vestimenta requerida como camiseta y pantaloneta). Así mismo, entiendo que de estas pruebas puede quedar registro fotográfico y/o en videos los cuáles serán manejados por el responsable de la información de forma ética y solo con las finalidades establecidas en el presente documento.</li>
            <li>Que, durante la realización de las pruebas físicas, se podrán sufrir lesiones osteomusculares, cansancio muscular, hipoglucemia, desequilibrio hidroelectrolítico, arritmias, mareo, angina de pecho, dolor en las piernas o signos de hipertensión arterial, las cuales son producto del estímulo y la exigencia de las pruebas físicas.</li>
            <li>Que cuento con afiliación al Sistema General de Seguridad Social en Salud perteneciente al régimen contributivo o subsidiado y que me encuentro activo para hacer uso de los servicios médicos ante una eventualidad.</li>
            <li>Que asumo voluntariamente los riesgos de la valoración y las actividades que componen la prueba y, en consecuencia, eximo a la Corporación Universitaria del Caribe - CECAR de cualquier daño o perjuicio que pueda sufrir en el desarrollo de la valoración y las pruebas.</li>
            <li>Que podré retirarme de la prueba en cualquier momento de manera libre y espontánea.</li>
            <li>Que, toda la información obtenida y recolectada será tratada usada de manera confidencial, conforme a la normativa vigente sobre protección de datos personales, ley 1581 de 2012, la política de tratamiento de datos personales y lo informado en el presente documento.</li>
            <li>Que, los datos serán compartidos únicamente con el paciente, deportista o no deportista evaluado y, si es necesario, con los profesionales o terceros autorizados previamente por el paciente, deportista o no deportista evaluado.</li>
            <li>Que la información, será archivada en medio físico y medio electrónico, en el Laboratorio de Evaluación del Rendimiento Morfofuncional de la Corporación Universitaria del Caribe CECAR.</li>
            <li>Los datos recolectados en las evaluaciones o estudios realizadas al interior de laboratorio podrán ser utilizados como con fines educativos, así como investigativos manteniendo el anonimato del personal evaluado.</li>
          </ol>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left hover:no-underline">
          Finalidad de recolección de datos
        </AccordionTrigger>
        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
          <p>En consecuencia, he sido informado que los datos se recolectan con la finalidad de:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>verificar la participación en las pruebas o actividades.</li>
            <li>validar la ejecución del evento y/o actividad.</li>
            <li>promocionar y divulgar por medio de la página web de la corporación, folletos, redes sociales y presentaciones (manteniendo el anonimato de los participantes).</li>
            <li>realizar las respectivas valoraciones para las investigaciones o trabajos de práctica de campo y laboratorio a cargo del programa de ciencias del deporte y la actividad física.</li>
            <li>recibir información sobre próximos eventos o actividades a realizar y los relacionados con las actividades en las que participa.</li>
            <li>llevar a cabo la valoración de la aptitud para la actividad física mediante pruebas de campo, laboratorio o cuestionarios.</li>
            <li>realizar la valoración de las variables antropométricas.</li>
            <li>determinar si se requieren pruebas adicionales que se aplicarán según resultados, pruebas físicas, psicométricas, socioeconómicas y antropométricas.</li>
            <li>compartir información y resultados de las pruebas en espacios educativos e investigativos (sin revelar los titulares de los datos).</li>
            <li>caracterizar las condiciones sociodemográficas y todas aquellas relacionadas con el propósito educativo o investigativo.</li>
            <li>responder cuestionarios psicométricos, de información socioeconómica o aptitud física.</li>
            <li>validar los resultados obtenidos los cuales permitirán mejorar los procesos de evaluación de sujetos con condiciones estudiadas.</li>
          </ul>
          <p>
           En este sentido, como titular de la información o representante legal del menor que participa conozco que la recolección, uso, tratamiento, transmisión, transferencia, destrucción, corrección, eliminación o cualquier forma de tratamiento a mis datos personales o de mi representado se realizará conforme a las normas aplicables en la materia y conforme la Política de Tratamiento de Datos Personales adoptada por CECAR, la cual podrá ser consultada en la página web de la corporación www.cecar.edu.co. Así mismo, se me informa los derechos que tengo como titular de los datos (acceso, rectificación, cancelación, revocación y supresión) que pueden ser ejercidos a través de los siguientes canales: correo oficialdedatos@cecar.edu.co o en las direcciones físicas: En Sincelejo – Sucre en la Carretera Troncal Occidente Km 1, vía Corozal - Sincelejo (Oficina planeación).
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

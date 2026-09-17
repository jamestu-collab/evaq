import MedecinForm from "@/components/medecins/MedecinForm";

export default function NouveauMedecinPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Ajouter un médecin</h1>
      <MedecinForm />
    </div>
  );
}

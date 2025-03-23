
import { StepProps } from "./types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const FavoriteAnimalStep = ({ data, onUpdate, onNext }: StepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.favoriteAnimal.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Vad är {data.childName}s favoritdjur?
      </h2>
      <div className="space-y-4">
        <Label htmlFor="favoriteAnimal">Favoritdjur</Label>
        <Input
          id="favoriteAnimal"
          type="text"
          value={data.favoriteAnimal}
          onChange={(e) => onUpdate("favoriteAnimal", e.target.value)}
          className="form-input"
          placeholder="Skriv barnets favoritdjur..."
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Nästa
      </Button>
    </form>
  );
};
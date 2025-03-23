
import { StepProps } from "./types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AgeStep = ({ data, onUpdate, onNext }: StepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.childAge > 0) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Hur gammal är {data.childName}?
      </h2>
      <div className="space-y-4">
        <Label htmlFor="childAge">Ålder</Label>
        <Input
          id="childAge"
          type="number"
          min="0"
          max="18"
          value={data.childAge || ""}
          onChange={(e) => onUpdate("childAge", Number(e.target.value))}
          className="form-input"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Nästa
      </Button>
    </form>
  );
};
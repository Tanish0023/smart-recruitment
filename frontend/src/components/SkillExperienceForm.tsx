import { useState, useMemo } from "react";
import { ChevronDown, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SkillExperience {
  id: string;
  name: string;
}

interface SkillExperienceData {
  [skillId: string]: {
    workExperience: number;
    personalProjectExperience: number;
  };
}

interface SkillExperienceFormProps {
  requiredSkills: SkillExperience[];
  onSubmit: (experienceData: SkillExperienceData) => void;
  loading?: boolean;
  onBack?: () => void;
}

export function SkillExperienceForm({
  requiredSkills,
  onSubmit,
  loading = false,
  onBack,
}: SkillExperienceFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    () => new Set(requiredSkills.map((skill) => skill.id))
  );
  const [experienceData, setExperienceData] = useState<SkillExperienceData>(() =>
    requiredSkills.reduce<SkillExperienceData>((acc, skill) => {
      acc[skill.id] = { workExperience: 0, personalProjectExperience: 0 };
      return acc;
    }, {})
  );
  const [expandedSkill, setExpandedSkill] = useState<string | null>(requiredSkills[0]?.id ?? null);

  const handleAddSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    newSelected.add(skillId);
    setSelectedSkills(newSelected);

    if (!experienceData[skillId]) {
      setExperienceData({
        ...experienceData,
        [skillId]: { workExperience: 0, personalProjectExperience: 0 },
      });
    }
    setExpandedSkill(skillId);
  };

  const handleRemoveSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    newSelected.delete(skillId);
    setSelectedSkills(newSelected);

    const newData = { ...experienceData };
    delete newData[skillId];
    setExperienceData(newData);

    if (expandedSkill === skillId) {
      setExpandedSkill(null);
    }
  };

  const handleExperienceChange = (
    skillId: string,
    field: "workExperience" | "personalProjectExperience",
    value: string
  ) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setExperienceData({
      ...experienceData,
      [skillId]: {
        ...experienceData[skillId],
        [field]: numValue,
      },
    });
  };

  const unselectedSkills = useMemo(() => {
    return requiredSkills.filter((s) => !selectedSkills.has(s.id));
  }, [requiredSkills, selectedSkills]);

  const selectedSkillsData = useMemo(() => {
    return Array.from(selectedSkills).map((id) => {
      const skill = requiredSkills.find((s) => s.id === id);
      return { id, name: skill?.name || "", experience: experienceData[id] };
    });
  }, [selectedSkills, experienceData, requiredSkills]);

  const handleSubmit = () => {
    if (selectedSkills.size === 0) {
      alert("Please add at least one skill");
      return;
    }

    // Convert string keys to actual numbers for backend
    const dataToSubmit: SkillExperienceData = {};
    Object.entries(experienceData).forEach(([skillId, exp]) => {
      dataToSubmit[skillId] = exp;
    });

    onSubmit(dataToSubmit);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Share Your Experience
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Tell us about your experience with the required skills
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Add skills to share how many years of work and personal project experience you have with each skill.
        </p>
      </div>

      {/* Selected Skills */}
      {selectedSkillsData.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
            Added Skills ({selectedSkillsData.length})
          </h3>
          <div className="space-y-2">
            {selectedSkillsData.map((skill) => (
              <div
                key={skill.id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900"
              >
                {/* Skill Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSkill(expandedSkill === skill.id ? null : skill.id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    {skill.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {skill.experience && (
                      <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        Work: {skill.experience.workExperience}y
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedSkill === skill.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Skill Details */}
                {expandedSkill === skill.id && (
                  <div className="border-t border-gray-200 dark:border-slate-700 px-4 py-4 bg-gray-50 dark:bg-slate-800/50 space-y-4">
                    {/* Work Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Years of Work Experience
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g., 2.5"
                          value={skill.experience?.workExperience || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              skill.id,
                              "workExperience",
                              e.target.value
                            )
                          }
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          years
                        </span>
                      </div>
                    </div>

                    {/* Personal Project Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Years of Personal Project Experience
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g., 1"
                          value={
                            skill.experience?.personalProjectExperience || ""
                          }
                          onChange={(e) =>
                            handleExperienceChange(
                              skill.id,
                              "personalProjectExperience",
                              e.target.value
                            )
                          }
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          years
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add More Skills */}
      {unselectedSkills.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">
            Available Skills
          </h3>
          <div className="space-y-2">
            {unselectedSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleAddSkill(skill.id)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all text-left group"
              >
                <span className="text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-100">
                  {skill.name}
                </span>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || selectedSkills.size === 0}
          className="flex-1"
        >
          {loading ? "Submitting..." : "Continue & Apply"}
        </Button>
      </div>

      {/* Summary */}
      {selectedSkills.size > 0 && (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-gray-600 dark:text-slate-400">
          You've added experience for <strong>{selectedSkills.size}</strong> skill
          {selectedSkills.size !== 1 ? "s" : ""}. Ready to submit your application!
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgentProfile {
  id: string;
  user_id: string;
  name: string;
  role: string;
  description: string | null;
  system_prompt: string;
  avatar_url: string | null;
  numerology_number: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NumerologyPreset {
  id: string;
  number: number;
  name: string;
  description: string;
  traits: {
    strengths: string[];
    focus: string;
    energy: string;
  };
  system_prompt_template: string;
  color_scheme: {
    primary: string;
    accent: string;
  } | null;
}

export const useAgentProfiles = () => {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<AgentProfile | null>(null);
  const [numerologyPresets, setNumerologyPresets] = useState<NumerologyPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
    loadNumerologyPresets();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      setProfiles(data || []);
      const active = data?.find(p => p.is_active);
      setActiveProfile(active || null);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load agent profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadNumerologyPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('numerology_presets' as any)
        .select('*')
        .order('number', { ascending: true }) as any;

      if (error) throw error;
      setNumerologyPresets(data || []);
    } catch (error) {
      console.error('Error loading numerology presets:', error);
    }
  };

  const createProfile = async (profile: Omit<AgentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agent_profiles' as any)
        .insert([{ ...profile, user_id: user.id }])
        .select()
        .single() as any;

      if (error) throw error;

      setProfiles(prev => [data, ...prev]);
      toast.success('Agent profile created');
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
      throw error;
    }
  };

  const updateProfile = async (id: string, updates: Partial<AgentProfile>) => {
    try {
      const { data, error } = await supabase
        .from('agent_profiles' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any;

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === id ? data : p));
      if (activeProfile?.id === id) setActiveProfile(data);
      toast.success('Profile updated');
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_profiles' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== id));
      if (activeProfile?.id === id) setActiveProfile(null);
      toast.success('Profile deleted');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
      throw error;
    }
  };

  const switchToProfile = async (id: string) => {
    try {
      // Deactivate current profile
      if (activeProfile) {
        await supabase
          .from('agent_profiles' as any)
          .update({ is_active: false })
          .eq('id', activeProfile.id);
      }

      // Activate new profile
      const { data, error } = await supabase
        .from('agent_profiles' as any)
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single() as any;

      if (error) throw error;

      setActiveProfile(data);
      setProfiles(prev => prev.map(p => ({ ...p, is_active: p.id === id })));
      toast.success(`Switched to ${data.name}`);
    } catch (error) {
      console.error('Error switching profile:', error);
      toast.error('Failed to switch profile');
    }
  };

  const switchToUserMode = async () => {
    if (activeProfile) {
      try {
        await supabase
          .from('agent_profiles' as any)
          .update({ is_active: false })
          .eq('id', activeProfile.id);

        setActiveProfile(null);
        setProfiles(prev => prev.map(p => ({ ...p, is_active: false })));
        toast.success('Switched to user mode');
      } catch (error) {
        console.error('Error switching to user mode:', error);
        toast.error('Failed to switch to user mode');
      }
    }
  };

  return {
    profiles,
    activeProfile,
    numerologyPresets,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    switchToProfile,
    switchToUserMode,
    reload: loadProfiles
  };
};

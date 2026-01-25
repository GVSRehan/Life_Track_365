import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  ExpenseGroup, 
  ExpenseGroupMember, 
  GroupType,
  CurrencyType,
  GroupInviteStatus
} from '@/types/expense';

export const useExpenseGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['expense-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        groupType: g.group_type as GroupType,
        createdBy: g.created_by,
        inviteCode: g.invite_code,
        currency: g.currency as CurrencyType,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })) as ExpenseGroup[];
    },
    enabled: !!user,
  });

  // Fetch members of a specific group
  const useGroupMembers = (groupId: string) => {
    return useQuery({
      queryKey: ['expense-group-members', groupId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('expense_group_members')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at');
        
        if (error) throw error;
        
        return data.map(m => ({
          id: m.id,
          groupId: m.group_id,
          userId: m.user_id,
          role: m.role as 'admin' | 'member',
          status: m.status as GroupInviteStatus,
          joinedAt: m.joined_at,
          createdAt: m.created_at,
        })) as ExpenseGroupMember[];
      },
      enabled: !!groupId && !!user,
    });
  };

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (group: {
      name: string;
      description?: string;
      groupType: GroupType;
      currency: CurrencyType;
    }) => {
      const { data, error } = await supabase
        .from('expense_groups')
        .insert({
          name: group.name,
          description: group.description || null,
          group_type: group.groupType,
          currency: group.currency,
          created_by: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (group: Partial<ExpenseGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('expense_groups')
        .update({
          name: group.name,
          description: group.description,
          group_type: group.groupType,
          currency: group.currency,
        })
        .eq('id', group.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('expense_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  // Join group by invite code
  const joinGroupMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('expense_groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      
      if (groupError) throw groupError;
      if (!group) throw new Error('Invalid invite code');
      
      // Request to join
      const { data, error } = await supabase
        .from('expense_group_members')
        .insert({
          group_id: group.id,
          user_id: user!.id,
          role: 'member',
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already requested to join this group');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  // Approve/reject member
  const updateMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: GroupInviteStatus }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'accepted') {
        updateData.joined_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('expense_group_members')
        .update(updateData)
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expense-group-members'] });
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  // Remove member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('expense_group_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-group-members'] });
    },
  });

  // Regenerate invite code
  const regenerateInviteCodeMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Generate new code using database function
      const { data, error } = await supabase
        .from('expense_groups')
        .update({ 
          invite_code: crypto.randomUUID().slice(0, 12).replace(/-/g, '') 
        })
        .eq('id', groupId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
    },
  });

  return {
    groups,
    isLoading: groupsLoading,
    useGroupMembers,
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: updateGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    joinGroup: joinGroupMutation.mutateAsync,
    updateMemberStatus: updateMemberStatusMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    regenerateInviteCode: regenerateInviteCodeMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    isJoining: joinGroupMutation.isPending,
  };
};

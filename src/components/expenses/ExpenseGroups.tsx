import { useState } from 'react';
import { Plus, Users, Copy, Check, UserPlus, UserMinus, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useExpenseGroups } from '@/hooks/useExpenseGroups';
import { useAuth } from '@/hooks/useAuth';
import { 
  GroupType, 
  CurrencyType, 
  CURRENCY_SYMBOLS, 
  CURRENCY_NAMES,
  ExpenseGroup 
} from '@/types/expense';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'roommates', label: 'Roommates', icon: '🏠' },
  { value: 'class', label: 'Class', icon: '🎓' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'work', label: 'Work', icon: '💼' },
];

const ExpenseGroups = () => {
  const { user } = useAuth();
  const { 
    groups, 
    isLoading, 
    createGroup, 
    joinGroup,
    deleteGroup,
    regenerateInviteCode,
    isCreating,
    isJoining 
  } = useExpenseGroups();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<GroupType>('family');
  const [newGroupCurrency, setNewGroupCurrency] = useState<CurrencyType>('INR');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Join group state
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      await createGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        groupType: newGroupType,
        currency: newGroupCurrency,
      });
      toast.success('Group created!');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      await joinGroup(inviteCode.trim());
      toast.success('Join request sent! Waiting for approval.');
      setShowJoinDialog(false);
      setInviteCode('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to join group';
      toast.error(message);
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setNewGroupName('');
    setNewGroupType('family');
    setNewGroupCurrency('INR');
    setNewGroupDescription('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 w-32 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Expense Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="My Family"
                />
              </div>

              <div className="space-y-2">
                <Label>Group Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUP_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant="outline"
                      className={cn(
                        "h-auto py-2 flex flex-col items-center gap-1",
                        newGroupType === type.value && "border-primary bg-primary/10"
                      )}
                      onClick={() => setNewGroupType(type.value)}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={newGroupCurrency} onValueChange={(v) => setNewGroupCurrency(v as CurrencyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                      <SelectItem key={code} value={code}>
                        {symbol} {CURRENCY_NAMES[code as CurrencyType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Shared expenses for our home"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateGroup}
                disabled={isCreating}
              >
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                />
                <p className="text-xs text-muted-foreground">
                  Ask the group admin for the invite code
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleJoinGroup}
                disabled={isJoining}
              >
                Request to Join
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">No groups yet</p>
            <p className="text-sm text-muted-foreground">
              Create or join a group to share expenses
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              isCreator={group.createdBy === user?.id}
              onCopyCode={handleCopyCode}
              copiedCode={copiedCode}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
};

// Group Card Component
const GroupCard = ({ 
  group, 
  isCreator, 
  onCopyCode, 
  copiedCode 
}: { 
  group: ExpenseGroup;
  isCreator: boolean;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) => {
  const { useGroupMembers, updateMemberStatus, removeMember } = useExpenseGroups();
  const { data: members = [] } = useGroupMembers(group.id);
  
  const pendingMembers = members.filter(m => m.status === 'pending');
  const acceptedMembers = members.filter(m => m.status === 'accepted');
  const groupTypeInfo = GROUP_TYPES.find(t => t.value === group.groupType);

  return (
    <AccordionItem value={group.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className="text-2xl">{groupTypeInfo?.icon}</span>
          <div>
            <p className="font-medium">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              {acceptedMembers.length} member{acceptedMembers.length !== 1 ? 's' : ''} • {CURRENCY_SYMBOLS[group.currency]}
            </p>
          </div>
          {pendingMembers.length > 0 && isCreator && (
            <Badge variant="secondary" className="ml-2">
              {pendingMembers.length} pending
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        {/* Invite Code */}
        {isCreator && (
          <div className="p-3 rounded-lg bg-muted/50">
            <Label className="text-xs">Invite Code</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-2 py-1 bg-background rounded text-sm font-mono">
                {group.inviteCode}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onCopyCode(group.inviteCode)}
              >
                {copiedCode === group.inviteCode ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {isCreator && pendingMembers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Pending Requests</Label>
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded bg-amber-500/10">
                <span className="text-sm">{member.userId.slice(0, 8)}...</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-green-600"
                    onClick={() => updateMemberStatus({ memberId: member.id, status: 'accepted' })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive"
                    onClick={() => updateMemberStatus({ memberId: member.id, status: 'rejected' })}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Members */}
        <div className="space-y-2">
          <Label className="text-xs">Members</Label>
          {acceptedMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                  {member.role === 'admin' ? '👑' : '👤'}
                </div>
                <span className="text-sm">{member.userId.slice(0, 8)}...</span>
                {member.role === 'admin' && (
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                )}
              </div>
              {isCreator && member.role !== 'admin' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-destructive"
                  onClick={() => removeMember(member.id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ExpenseGroups;

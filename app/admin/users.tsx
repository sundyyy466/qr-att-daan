
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';

type Role = 'student' | 'teacher' | 'admin';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

type FilterRole = 'all' | Role;

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Administrator', value: 'admin' },
];

function normalizeRole(role: string): string {
  return role.toLowerCase() === 'administrator' ? 'admin' : role.toLowerCase();
}

function roleLabel(role: string): string {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return 'Administrator';
  if (normalized === 'teacher') return 'Teacher';
  if (normalized === 'student') return 'Student';
  return role || 'No role';
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterRole>('all');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('email', { ascending: true });

      if (queryError) throw queryError;
      setUsers((data ?? []) as Profile[]);
    } catch (err) {
      console.error('Admin users error:', err);
      setError('Unable to load users. Check your Supabase permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  
const saveUserRole = async (userId: string, newRole: string) => {
  const targetUser = users.find((user) => user.id === userId);

if (
  targetUser?.full_name?.toLowerCase() === 'administrator' &&
  newRole.toLowerCase() !== 'administrator'
) {
  setError('The Administrator account cannot be changed to another role.');
  return;
}
  setError('');

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole.toLowerCase() })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    await loadUsers();
    setEditingUser(null);
  } catch (err) {
    console.error('Save user role error:', err);
    setError('Unable to save role. Check your Supabase permissions.');
  }
};

useEffect(() => {
  loadUsers();
}, [loadUsers]);


  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        (user.full_name ?? '').toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        roleLabel(user.role).toLowerCase().includes(query);

      const matchesRole =
        activeFilter === 'all' ||
        normalizeRole(user.role) === activeFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, activeFilter]);

  const openEditRole = (user: Profile) => {
    const currentRole = normalizeRole(user.role);
    const validRole = ROLE_OPTIONS.some((option) => option.value === currentRole);

    setSelectedUser(user);
    setSelectedRole(validRole ? (currentRole as Role) : 'student');
    setRoleModalVisible(true);
  };

  const saveRole = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? { ...user, role: selectedRole }
            : user
        )
      );

      setRoleModalVisible(false);
      setSelectedUser(null);
      Alert.alert('Success', 'User role updated.');
    } catch (err) {
      console.error('Update role error:', err);
      Alert.alert(
        'Unable to update role',
        'Supabase rejected the change. Check your table permissions and role constraints.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (deleteError) throw deleteError;

      setUsers((current) =>
        current.filter((user) => user.id !== selectedUser.id)
      );

      setDeleteModalVisible(false);
      setSelectedUser(null);
      Alert.alert('Deleted', 'The user profile was deleted.');
    } catch (err) {
      console.error('Delete user error:', err);
      Alert.alert(
        'Unable to delete user',
        'Supabase rejected the deletion. Check your permissions and database relationships.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderUser = ({ item, index }: { item: Profile; index: number }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.numberCell]}>{index + 1}</Text>

      <View style={[styles.cell, styles.nameCell]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.name} numberOfLines={1}>
            {item.full_name || 'Name not provided'}
          </Text>
        </View>
      </View>

      <Text style={[styles.cell, styles.emailCell]} numberOfLines={2}>
        {item.email}
      </Text>

      <View style={[styles.cell, styles.roleCell]}>
        <View
          style={[
            styles.roleBadge,
            normalizeRole(item.role) === 'teacher' && styles.teacherBadge,
            normalizeRole(item.role) === 'admin' && styles.adminBadge,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              normalizeRole(item.role) === 'teacher' && styles.teacherText,
              normalizeRole(item.role) === 'admin' && styles.adminText,
            ]}
          >
            {roleLabel(item.role)}
          </Text>
        </View>
      </View>

      <View style={[styles.cell, styles.dateCell]}>
        <Text style={styles.mutedText}>—</Text>
      </View>

      <View style={[styles.cell, styles.actionsCell]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.pressed,
          ]}
          onPress={() => openEditRole(item)}
          accessibilityRole="button"
          accessibilityLabel={`Edit role for ${item.full_name || item.email}`}
        >
          <Text style={styles.editButtonText}>✎</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setSelectedUser(item);
            setDeleteModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.full_name || item.email}`}
        >
          <Text style={styles.deleteButtonText}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Manage Users</Text>
      <Text style={styles.subtitle}>
        View registered students, teachers, and administrators.
      </Text>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, or role..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {[
            { label: 'All', value: 'all' as const },
            { label: 'Students', value: 'student' as const },
            { label: 'Teachers', value: 'teacher' as const },
            { label: 'Administrators', value: 'admin' as const },
          ].map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => setActiveFilter(filter.value)}
              style={[
                styles.filterButton,
                activeFilter === filter.value && styles.activeFilter,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter.value }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.value && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#328B9B" style={styles.loader} />
      ) : error ? (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadUsers}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.headerCell, styles.numberCell]}>#</Text>
                <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
                <Text style={[styles.headerCell, styles.emailCell]}>Email</Text>
                <Text style={[styles.headerCell, styles.roleCell]}>Role</Text>
                <Text style={[styles.headerCell, styles.dateCell]}>
                  Date Registered
                </Text>
                <Text style={[styles.headerCell, styles.actionsCell]}>
                  Actions
                </Text>
              </View>

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      loadUsers();
                    }}
                  />
                }
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    {search.trim() || activeFilter !== 'all'
                      ? 'No users match your search or filter.'
                      : 'No user profiles found.'}
                  </Text>
                }
              />
            </View>
          </ScrollView>
        </View>
      )}

      <Text style={styles.resultCount}>
        Showing {filteredUsers.length} of {users.length} users
      </Text>

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit User Role</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.full_name || selectedUser?.email}
            </Text>

            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.roleOption,
                  selectedRole === option.value && styles.selectedRoleOption,
                ]}
                onPress={() => setSelectedRole(option.value)}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === option.value && styles.selectedRoleText,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.radioText}>
                  {selectedRole === option.value ? '●' : '○'}
                </Text>
              </Pressable>
            ))}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setRoleModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveButton}
                onPress={saveRole}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Save Role</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete User?</Text>
            <Text style={styles.modalSubtitle}>
              Delete the profile for{' '}
              {selectedUser?.full_name || selectedUser?.email}? This action
              cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmDeleteButton}
                onPress={deleteUser}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
screen: {
  flex: 1,
  width: '100%',
  alignSelf: 'stretch',
  backgroundColor: '#F3FAFA',
  paddingHorizontal: 24,
  paddingTop: 24,
  paddingBottom: 20,
},
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#17345B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  searchWrap: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    color: '#637A95',
    fontSize: 24,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 15,
    fontSize: 15,
    color: COLORS.textPrimary,
    outlineStyle: 'none',
  } as any,
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DCE8ED',
    backgroundColor: '#FFFFFF',
  },
  activeFilter: {
    backgroundColor: '#328B9B',
    borderColor: '#328B9B',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52677E',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 36,
  },
tableCard: {
  flex: 1,
  width: '100%',
  alignSelf: 'stretch',
  minHeight: 400,
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#DCE8ED',
  padding: 16,
},
table: {
  width: '100%',
  minWidth: 900,
  flex: 1,
},
  tableHeader: {
    backgroundColor: '#F2F7FA',
    borderRadius: 10,
    borderBottomWidth: 0,
  },
tableRow: {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 66,
  borderBottomWidth: 1,
  borderBottomColor: '#E8EEF2',
  paddingHorizontal: 10,
},
cell: {
  paddingHorizontal: 10,
  paddingVertical: 12,
  color: '#536982',
  fontSize: 14,
},
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 17,
    color: '#536982',
    fontWeight: '700',
    fontSize: 14,
  },
  numberCell: {
  width: 55,
},
nameCell: {
  width: 250,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
emailCell: {
  width: 280,
},
roleCell: {
  width: 180,
},
dateCell: {
  width: 200,
},
actionsCell: {
  width: 130,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8DEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6D43C3',
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#243A59',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E4EEFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3473D8',
  },
  teacherBadge: {
    backgroundColor: '#DDF6F6',
  },
  teacherText: {
    color: '#178A96',
  },
  adminBadge: {
    backgroundColor: '#EEE5FF',
  },
  adminText: {
    color: '#7146C6',
  },
  actionButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  editButton: {
    backgroundColor: '#E7EEFF',
  },
  editButtonText: {
    color: '#3977E8',
    fontSize: 22,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FCE8E8',
  },
  deleteButtonText: {
    color: '#D94848',
    fontSize: 21,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  mutedText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  empty: {
    padding: 30,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  resultCount: {
    marginTop: 14,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  messageBox: {
    padding: 16,
    backgroundColor: '#FDECEC',
    borderRadius: 10,
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#328B9B',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 28, 46, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#17345B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#63758B',
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E8EF',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedRoleOption: {
    backgroundColor: '#EAF7F8',
    borderColor: '#328B9B',
  },
  roleOptionText: {
    color: '#40566F',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedRoleText: {
    color: '#237C8A',
  },
  radioText: {
    color: '#328B9B',
    fontSize: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#EDF1F5',
  },
  cancelText: {
    color: '#52677E',
    fontWeight: '700',
  },
  saveButton: {
    minWidth: 110,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#328B9B',
  },
  confirmDeleteButton: {
    minWidth: 100,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#D94848',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


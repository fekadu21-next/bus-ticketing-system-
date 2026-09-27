import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUsersApi, getOrganizationsApi, getRolesApi, getPermissionsApi } from '@/api/organization.api';
import api from '@/services/api';
import { Users, Building2, ShieldCheck, Key, Activity, RefreshCw } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'organizations' | 'roles' | 'permissions'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    userCount: 0,
    orgCount: 0,
    roleCount: 0,
    permissionCount: 0,
    systemStatus: 'Healthy',
  });

  const [usersList, setUsersList] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, orgsRes, rolesRes, permsRes, healthRes] = await Promise.allSettled([
        getUsersApi({ limit: 10 }),
        getOrganizationsApi({ limit: 10 }),
        getRolesApi(),
        getPermissionsApi(),
        api.get('/health'),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        setUsersList(usersRes.value.data.users || []);
        setStats((prev) => ({ ...prev, userCount: usersRes.value.data.total || usersRes.value.data.users?.length || 0 }));
      }

      if (orgsRes.status === 'fulfilled' && orgsRes.value?.data) {
        setOrgsList(orgsRes.value.data.organizations || []);
        setStats((prev) => ({ ...prev, orgCount: orgsRes.value.data.total || orgsRes.value.data.organizations?.length || 0 }));
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value?.data) {
        setRolesList(rolesRes.value.data.roles || []);
        setStats((prev) => ({ ...prev, roleCount: rolesRes.value.data.roles?.length || 0 }));
      }

      if (permsRes.status === 'fulfilled' && permsRes.value?.data) {
        setPermissionsList(permsRes.value.data.permissions || []);
        setStats((prev) => ({ ...prev, permissionCount: permsRes.value.data.permissions?.length || 0 }));
      }

      if (healthRes.status === 'fulfilled') {
        setStats((prev) => ({ ...prev, systemStatus: 'UP (Normal)' }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load system metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-strip">
        <div>
          <span className="badge-role admin">ADMINISTRATOR PORTAL</span>
          <h1>Admin Control Panel</h1>
          <p>Logged in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})</p>
        </div>
        <button onClick={loadAdminData} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} /> System Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Users ({stats.userCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'organizations' ? 'active' : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} /> Organizations ({stats.orgCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <ShieldCheck size={16} /> Roles ({stats.roleCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Key size={16} /> Permissions ({stats.permissionCount})
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading-state">
          <LoadingSpinner size="lg" message="Loading admin data..." />
        </div>
      ) : (
        <div className="dashboard-tab-content">
          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <Users size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-number">{stats.userCount}</span>
                  <span className="stat-label">Total Registered Users</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper green">
                  <Building2 size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-number">{stats.orgCount}</span>
                  <span className="stat-label">Partner Organizations</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper amber">
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-number">{stats.roleCount}</span>
                  <span className="stat-label">Configured RBAC Roles</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper purple">
                  <Activity size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-number">{stats.systemStatus}</span>
                  <span className="stat-label">Backend Health Status</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="data-table-card">
              <div className="table-header">
                <h3>Registered Users</h3>
              </div>
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Email Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr><td colSpan={5} className="text-center">No users found.</td></tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.firstName} {u.lastName}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td>
                            <span className={`status-pill ${u.isActive ? 'active' : 'inactive'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${u.emailVerified ? 'verified' : 'unverified'}`}>
                              {u.emailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORGANIZATIONS */}
          {activeTab === 'organizations' && (
            <div className="data-table-card">
              <div className="table-header">
                <h3>Transport Organizations</h3>
              </div>
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Organization Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Staff Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgsList.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">No organizations found.</td></tr>
                    ) : (
                      orgsList.map((org) => (
                        <tr key={org.id}>
                          <td><strong>{org.name}</strong></td>
                          <td>{org.type || 'COMPANY'}</td>
                          <td>
                            <span className={`status-pill ${org.isActive ? 'active' : 'inactive'}`}>
                              {org.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{org.memberCount || 0} members</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROLES */}
          {activeTab === 'roles' && (
            <div className="data-table-card">
              <div className="table-header">
                <h3>System Roles</h3>
              </div>
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Role Identifier</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesList.map((role) => (
                      <tr key={role.id}>
                        <td><code>{role.name}</code></td>
                        <td>{role.description || 'System access role'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="data-table-card">
              <div className="table-header">
                <h3>System Permissions</h3>
              </div>
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Permission Key</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionsList.map((perm) => (
                      <tr key={perm.id}>
                        <td><code>{perm.name}</code></td>
                        <td>{perm.description || 'RBAC permission flag'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

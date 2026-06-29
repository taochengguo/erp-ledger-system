import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  Database, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  HardDrive,
  FileArchive,
  Terminal,
  Activity,
  UserPlus
} from 'lucide-react';
import { BackendUserRecord } from '../api';
import { ROLE_LABELS, RoleCode } from '../lib/permissions';
import { OperationLog, BackupInfo } from '../types';

interface SystemScreenProps {
  logs: OperationLog[];
  backups: BackupInfo[];
  onAddBackup: (backup: BackupInfo) => void;
  onRefresh: () => void;
  users: BackendUserRecord[];
  canManageUsers: boolean;
  onCreateUser: (data: { username: string; password: string; display_name: string; role_code: string }) => Promise<void>;
}

export default function SystemScreen({ logs, backups, onAddBackup, onRefresh, users, canManageUsers, onCreateUser }: SystemScreenProps) {
  // Pagination State for Logs
  const [logPage, setLogPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination State for Backups
  const [backupPage, setBackupPage] = useState(1);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    display_name: '',
    role_code: 'viewer',
  });
  const [userMessage, setUserMessage] = useState('');

  // Filter logs & backups to show only 5 items per page
  const paginatedLogs = useMemo(() => {
    const startIndex = (logPage - 1) * itemsPerPage;
    return logs.slice(startIndex, startIndex + itemsPerPage);
  }, [logs, logPage]);

  const paginatedBackups = useMemo(() => {
    const startIndex = (backupPage - 1) * itemsPerPage;
    return backups.slice(startIndex, startIndex + itemsPerPage);
  }, [backups, backupPage]);

  const totalLogPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const totalBackupPages = Math.max(1, Math.ceil(backups.length / itemsPerPage));

  // Trigger Immediate Backup
  const handleImmediateBackup = () => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const backupTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const size = (115 + Math.random() * 15).toFixed(1) + " MB";
    const fileName = `db_backup_manual_${timestampStr}.sql.gz`;

    onAddBackup({
      id: `bk-${Date.now()}`,
      fileName,
      size,
      backupTime: backupTimeStr
    });

    alert(`备份成功创建: ${fileName} (${size})`);
    setBackupPage(1); // Reset to first page to see the newly added backup item
  };

  const handleSystemRestore = (fileName: string) => {
    const confirm = window.confirm(`您确定要使用备份文件 "${fileName}" 恢复系统数据库吗？此操作不可逆。`);
    if (confirm) {
      alert('系统数据库恢复成功！');
    }
  };

  const handleUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setUserMessage('');
    try {
      await onCreateUser(userForm);
      setUserForm({ username: '', password: '', display_name: '', role_code: 'viewer' });
      setUserMessage('账号创建成功');
    } catch (error) {
      setUserMessage(error instanceof Error ? error.message : '账号创建失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">系统信息与维护</h1>
          <p className="text-sm text-slate-500 font-sans mt-1">查看系统运行日志、管理数据备份并进行版本升级。</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button 
            onClick={() => {
              onRefresh();
              alert('视图与系统缓存数据刷新成功！');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新视图</span>
          </button>
        </div>
      </div>

      {canManageUsers && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>账号与权限管理</span>
            </h3>
            {userMessage && <span className="text-xs font-medium text-blue-600">{userMessage}</span>}
          </div>

          <div className="p-5 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
            <form onSubmit={handleUserSubmit} className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600">登录账号</span>
                  <input required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600">显示名称</span>
                  <input required value={userForm.display_name} onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600">初始密码</span>
                  <input required type="password" minLength={6} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600">权限角色</span>
                  <select value={userForm.role_code} onChange={(e) => setUserForm({ ...userForm, role_code: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white">
                    {(Object.keys(ROLE_LABELS) as RoleCode[]).map((roleCode) => (
                      <option key={roleCode} value={roleCode}>{ROLE_LABELS[roleCode]}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">创建账号</button>
            </form>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">账号</th>
                    <th className="px-4 py-2 font-semibold">姓名</th>
                    <th className="px-4 py-2 font-semibold">角色</th>
                    <th className="px-4 py-2 font-semibold">状态</th>
                    <th className="px-4 py-2 font-semibold">最后登录</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="text-xs text-slate-700">
                      <td className="px-4 py-2 font-mono text-blue-600">{user.username}</td>
                      <td className="px-4 py-2 font-semibold">{user.display_name}</td>
                      <td className="px-4 py-2">{ROLE_LABELS[user.role_code as RoleCode] || user.role_code}</td>
                      <td className="px-4 py-2">{user.is_active ? '启用' : '停用'}</td>
                      <td className="px-4 py-2 font-mono text-slate-400">{user.last_login_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 1. Operation Log Section with 5 per page pagination */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>操作日志</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[180px]">用户</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[140px]">操作模块</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[420px]">详情</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[160px]">操作时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-medium text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {log.user.charAt(0)}
                    </span>
                    <span>{log.user}</span>
                  </td>
                  <td className="px-6 py-3.5 text-xs">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 truncate" title={log.details}>{log.details}</td>
                  <td className="px-6 py-3.5 text-xs text-center text-slate-400 font-mono">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination 1 */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            显示 {logs.length === 0 ? 0 : (logPage - 1) * itemsPerPage + 1} 到 {Math.min(logPage * itemsPerPage, logs.length)} 条，共 {logs.length} 条记录
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={logPage === 1}
              onClick={() => setLogPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-3 py-1 bg-white border border-slate-200 rounded text-slate-700">
              Page {logPage} / {totalLogPages}
            </span>
            <button 
              disabled={logPage === totalLogPages}
              onClick={() => setLogPage(prev => Math.min(totalLogPages, prev + 1))}
              className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Backup Info Section with 5 per page pagination */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            <span>备份信息</span>
          </h3>
          {canManageUsers && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button 
                onClick={handleImmediateBackup}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>立即备份</span>
              </button>
              <button 
                onClick={() => alert('已将备份文件归档至异地容灾服务器！')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>系统恢复</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[360px]">文件名</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-right w-[180px]">大小</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[200px]">备份时间</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[160px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBackups.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-mono font-medium text-slate-800 flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{bk.fileName}</span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-right font-mono text-slate-600">{bk.size}</td>
                  <td className="px-6 py-3.5 text-xs text-center font-mono text-slate-400">{bk.backupTime}</td>
                  <td className="px-6 py-3.5 text-center">
                    <button 
                      onClick={() => handleSystemRestore(bk.fileName)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      恢复
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination 2 */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            显示 {backups.length === 0 ? 0 : (backupPage - 1) * itemsPerPage + 1} 到 {Math.min(backupPage * itemsPerPage, backups.length)} 条，共 {backups.length} 条记录
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={backupPage === 1}
              onClick={() => setBackupPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-3 py-1 bg-white border border-slate-200 rounded text-slate-700">
              Page {backupPage} / {totalBackupPages}
            </span>
            <button 
              disabled={backupPage === totalBackupPages}
              onClick={() => setBackupPage(prev => Math.min(totalBackupPages, prev + 1))}
              className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

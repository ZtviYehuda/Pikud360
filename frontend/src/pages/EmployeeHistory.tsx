import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeftRight, Edit, User } from 'lucide-react';
import { workforceService, TimelineEvent } from '../services/workforceService';
import { apiClient } from '../api/client';
import Unauthorized from './Unauthorized';

interface EmployeeProfile {
  id: string;
  first_name: string;
  last_name: string;
  rank: string;
  position: string;
  status: string;
}

export default function EmployeeHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('employees.history.view')) {
    return <Unauthorized />;
  }

  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      
      // Load profile info
      const empRes = await apiClient.get(`/api/workforce/employees/${id}`);
      setEmployee((empRes as any).data);

      // Load timeline events
      const timelineData = await workforceService.getEmployeeHistory(id);
      setTimeline(timelineData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('validation:unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/workforce/scheduling')}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={t('buttons:back')}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            {employee ? `${employee.rank} ${employee.first_name} ${employee.last_name}` : t('employees:history_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('employees:history_title')}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          {t('common:loading')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Info Card */}
          {employee && (
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm glassmorphism self-start">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <User className="h-5 w-5 text-indigo-500" />
                {t('employees:details')}
              </h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{t('employees:rank')}:</span>
                  <span className="text-slate-800 dark:text-white font-semibold">{employee.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{t('employees:role')}:</span>
                  <span className="text-slate-800 dark:text-white font-medium">{employee.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{t('employees:status')}:</span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400">
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm glassmorphism">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">
              {t('employees:history_title')}
            </h3>

            {timeline.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                {t('employees:no_history')}
              </div>
            ) : (
              <div className="relative border-r-2 mr-3 pr-6 border-slate-100 dark:border-slate-800 space-y-8">
                {timeline.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Event bullet point icon */}
                    <span className="absolute top-1.5 -right-9.5 flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500">
                      {event.type === 'TRANSFER' ? (
                        <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <Edit className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                          {event.type === 'TRANSFER'
                            ? t('common:transfers')
                            : `${event.change_type}`}
                        </h4>
                        <span className="text-2xs text-slate-400 font-medium">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString('he-IL') : ''}
                        </span>
                      </div>

                      {event.type === 'TRANSFER' ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          <p>
                            {t('common:transfers')} - 
                            <strong className="text-slate-700 dark:text-slate-300">{event.from_unit_name}</strong> 
                            &rarr;
                            <strong className="text-slate-700 dark:text-slate-300">{event.to_unit_name}</strong>.
                          </p>
                          {event.reason && (
                            <p className="mt-1 italic">
                              "{event.reason}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          <p>
                            {t('employees:history_title')}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-slate-50/50 dark:bg-slate-950/45 rounded-lg border border-slate-100 dark:border-slate-850">
                            {event.org_unit_name && (
                              <div>{t('common:organization')}: {event.org_unit_name}</div>
                            )}
                            {event.rank && (
                              <div>{t('employees:rank')}: {event.rank}</div>
                            )}
                            {event.position && (
                              <div>{t('employees:role')}: {event.position}</div>
                            )}
                            {event.status && (
                              <div>{t('employees:status')}: {event.status}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

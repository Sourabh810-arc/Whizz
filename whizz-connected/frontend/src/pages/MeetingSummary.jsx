import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Download, Mail, CheckSquare, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import api from '../utils/api';

const MeetingSummary = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/meetings/${meetingId}`);
      setMeeting(data.meeting);
    } catch {
      toast.error('Could not load meeting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/ai/${meetingId}/summary`);
      setMeeting((m) => ({ ...m, aiSummary: data.summary, aiMinutes: data.minutes, actionItems: data.actionItems }));
      toast.success('AI summary generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await api.get(`/ai/${meetingId}/summary/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `whizz-summary-${meetingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Generate the AI summary first');
    }
  };

  const emailSummary = async () => {
    setEmailing(true);
    try {
      const { data } = await api.post(`/ai/${meetingId}/summary/email`);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send email');
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Meeting Summary">
        <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
      </AppLayout>
    );
  }

  if (!meeting) return null;

  return (
    <AppLayout title="Meeting Summary">
      <div className="mx-auto max-w-3xl animate-fadeIn">
        <button onClick={() => navigate('/dashboard')} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="card mb-6 p-6">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{meeting.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Meeting ID: <code>{meeting.meetingId}</code> · {meeting.participants?.length || 0} participant(s)
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={generateSummary} disabled={generating} className="btn-primary">
              <Sparkles size={16} />
              {generating ? 'Generating...' : meeting.aiSummary ? 'Regenerate AI Summary' : 'Generate AI Summary'}
            </button>
            <button onClick={downloadPDF} className="btn-secondary">
              <Download size={16} /> Download PDF
            </button>
            <button onClick={emailSummary} disabled={emailing} className="btn-secondary">
              <Mail size={16} /> {emailing ? 'Sending...' : 'Email to Participants'}
            </button>
          </div>
        </div>

        {meeting.aiSummary ? (
          <>
            <SummaryCard icon={Sparkles} title="AI Summary" content={meeting.aiSummary} />
            <SummaryCard icon={FileText} title="Meeting Minutes" content={meeting.aiMinutes} preformatted />
            <div className="card mb-6 p-6">
              <div className="mb-3 flex items-center gap-2">
                <CheckSquare size={18} className="text-primary-600" />
                <h3 className="font-bold text-slate-800 dark:text-white">Action Items</h3>
              </div>
              {meeting.actionItems?.length ? (
                <ul className="flex flex-col gap-2">
                  {meeting.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span className="mt-0.5 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                        {item.owner || 'Unassigned'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No action items extracted.</p>
              )}
            </div>
          </>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <RefreshCw size={26} className="text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No AI summary yet. Click "Generate AI Summary" above — it uses the live captions transcript captured
              during the call.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const SummaryCard = ({ icon: Icon, title, content, preformatted }) => (
  <div className="card mb-6 p-6">
    <div className="mb-3 flex items-center gap-2">
      <Icon size={18} className="text-primary-600" />
      <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
    </div>
    <p className={`text-sm text-slate-600 dark:text-slate-300 ${preformatted ? 'whitespace-pre-line' : ''}`}>{content}</p>
  </div>
);

export default MeetingSummary;

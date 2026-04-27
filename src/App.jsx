import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChildDashboard from './pages/ChildDashboard';
import TaskSelect from './pages/TaskSelect';
import RewardExchange from './pages/RewardExchange';
import ChildHistory from './pages/ChildHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChildManager from './pages/admin/ChildManager';
import TaskManager from './pages/admin/TaskManager';
import RewardManager from './pages/admin/RewardManager';
import HistoryView from './pages/admin/HistoryView';
import Settings from './pages/admin/Settings';
import CategoryManager from './pages/admin/CategoryManager';
import EmojiManager from './pages/admin/EmojiManager';

import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/child/:id" element={<ChildDashboard />} />
        <Route path="/child/:id/tasks/:category" element={<TaskSelect />} />
        <Route path="/child/:id/rewards" element={<RewardExchange />} />
        <Route path="/child/:id/history" element={<ChildHistory />} />
        
        {/* Public Admin Route (Login) */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/children" element={<ChildManager />} />
          <Route path="/admin/tasks" element={<TaskManager />} />
          <Route path="/admin/rewards" element={<RewardManager />} />
          <Route path="/admin/history" element={<HistoryView />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/categories" element={<CategoryManager />} />
          <Route path="/admin/emojis" element={<EmojiManager />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import api from '../api/axios.js';

const DEFAULT_AVATAR = '../avatar.png';

function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [profilePreview, setProfilePreview] = useState(DEFAULT_AVATAR);
  const [selectedProfilePic, setSelectedProfilePic] = useState('');

  const userId = id ? Number(id) : currentUser?.id;
  const isOwnProfile = !id || Number(id) === currentUser?.id;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const { data } = await api.get(`/user/${userId}`);
        const loadedProfile = data.user;
        setProfile(loadedProfile);
        setFormValues({
          name: loadedProfile.name || '',
          email: loadedProfile.email || '',
          phone: loadedProfile.phone || '',
          bio: loadedProfile.bio || '',
        });
        setProfilePreview(loadedProfile.profilePic || DEFAULT_AVATAR);
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedProfilePic(reader.result);
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        bio: formValues.bio,
      };

      if (selectedProfilePic) {
        payload.profilePic = selectedProfilePic;
      }

      const updatedUser = await updateProfile(payload);
      setProfile(updatedUser);
      setMessage('Profile updated successfully.');
      setSelectedProfilePic('');
      setProfilePreview(updatedUser.profilePic || DEFAULT_AVATAR);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20">
          <p className="text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="mt-4 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="mb-6 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
        >
          Back to chat
        </button>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20">
            <div className="flex flex-col items-center gap-4 text-center">
              <img
                src={profilePreview}
                alt="Profile"
                className="h-40 w-40 rounded-full object-cover border border-slate-700"
              />
              <div>
                <h1 className="text-2xl font-semibold text-white">{profile.name}</h1>
                <p className="text-sm text-slate-400">{profile.email}</p>
                <p className="text-sm text-slate-400">{profile.phone}</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500">Bio</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-200">
                {profile.bio || 'No bio available.'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isOwnProfile ? 'Edit Your Profile' : 'User Profile'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isOwnProfile
                    ? 'Update your profile information.'
                    : 'View this user’s public profile details.'}
                </p>
              </div>
            </div>

            {message && <p className="mb-4 rounded-2xl bg-emerald-500/10 p-3 text-slate-200">{message}</p>}
            {error && <p className="mb-4 rounded-2xl bg-rose-500/10 p-3 text-rose-200">{error}</p>}

            {isOwnProfile ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="auth-input-label">Name</label>
                  <input
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="auth-input-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="auth-input-label">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formValues.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="auth-input-label">Bio</label>
                  <textarea
                    name="bio"
                    value={formValues.bio}
                    onChange={handleChange}
                    className="input min-h-[120px] resize-none"
                    placeholder="Write something about yourself..."
                  />
                </div>

                <div>
                  <label className="auth-input-label">Profile picture</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-slate-100" />
                  <p className="mt-2 text-sm text-slate-500">Upload a new picture to update your avatar.</p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Name</h3>
                  <p className="mt-2 text-slate-200">{profile.name}</p>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Email</h3>
                  <p className="mt-2 text-slate-200">{profile.email}</p>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Phone</h3>
                  <p className="mt-2 text-slate-200">{profile.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">Bio</h3>
                  <p className="mt-2 text-slate-200 whitespace-pre-wrap">{profile.bio || 'No bio available.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

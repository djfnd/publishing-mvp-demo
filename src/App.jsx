import React, { useState } from 'react';

// App state management
const SCREENS = {
  PROFILE_SETUP: 'profile_setup',
  RELEASE_VIEW: 'release_view', 
  PUBLISHING_CAPTURE: 'publishing_capture',
  SUBMISSION_COMPLETE: 'submission_complete',
  EXPORT_VIEW: 'export_view'
};

// Mock release data (simulating what would come from distribution)
const mockRelease = {
  id: 'rel_001',
  title: 'Mediterranean Dreams EP',
  artist: 'Luna Martinez',
  release_date: '2026-03-15',
  label: 'Horizon Music',
  tracks: [
    { id: 'trk_001', title: 'Midnight in Barcelona', altTitle: 'Medianoche en Barcelona', isrc: 'ES-AB1-24-00001', duration: '3:42', performers: 'Luna Martinez, Diego Fernández' },
    { id: 'trk_002', title: 'Costa Brava Sunset', altTitle: '', isrc: 'ES-AB1-24-00002', duration: '4:15', performers: 'Luna Martinez' },
    { id: 'trk_003', title: 'Waves of Valencia', altTitle: 'Olas de Valencia', isrc: 'ES-AB1-24-00003', duration: '3:58', performers: 'Luna Martinez, Sofia Ruiz' },
    { id: 'trk_004', title: 'Andalusian Nights', altTitle: '', isrc: 'ES-AB1-24-00004', duration: '5:01', performers: 'Luna Martinez' },
  ]
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.PROFILE_SETUP);
  const [profile, setProfile] = useState({
    songwriterName: '',
    ipi: '',
    pro: '',
    proMemberId: '',
    publisherName: '',
    publisherIpi: '',
    publisherType: 'self'
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [publishingData, setPublishingData] = useState({});
  const [bulkMode, setBulkMode] = useState(null); // 'same' | 'different' | null
  const [bulkWriterData, setBulkWriterData] = useState(null);
  
  // Publishing capture form state (lifted to top level)
  const [captureStep, setCaptureStep] = useState(0);
  const [captureFormData, setCaptureFormData] = useState({
    title: '',
    altTitles: '',
    iswc: '',
    ownershipSplit: '',
    hasCoWriters: null,
    coWriterCount: 1,
    coWriters: [
      { name: '', ipi: '', split: '', publisher: '' },
      { name: '', ipi: '', split: '', publisher: '' },
      { name: '', ipi: '', split: '', publisher: '' },
      { name: '', ipi: '', split: '', publisher: '' }
    ],
    hasSamples: null,
    sampleDetails: '',
    showSplitError: false
  });

  // Reset capture form when starting new capture
  const startCapture = (trackIndex, mode) => {
    const track = mockRelease.tracks[trackIndex];
    setCaptureStep(0);
    setCaptureFormData({
      title: track.title,
      altTitles: '',
      iswc: '',
      ownershipSplit: mode === 'same' && bulkWriterData ? bulkWriterData.ownershipSplit : '',
      hasCoWriters: mode === 'same' && bulkWriterData ? bulkWriterData.hasCoWriters : null,
      coWriterCount: mode === 'same' && bulkWriterData ? bulkWriterData.coWriterCount : 1,
      coWriters: mode === 'same' && bulkWriterData ? bulkWriterData.coWriters : [
        { name: '', ipi: '', split: '', publisher: '' },
        { name: '', ipi: '', split: '', publisher: '' },
        { name: '', ipi: '', split: '', publisher: '' },
        { name: '', ipi: '', split: '', publisher: '' }
      ],
      hasSamples: null,
      sampleDetails: '',
      showSplitError: false
    });
    setCurrentTrackIndex(trackIndex);
    setBulkMode(mode);
    setScreen(SCREENS.PUBLISHING_CAPTURE);
  };

  // Profile setup handlers
  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const isProfileComplete = () => {
    return profile.songwriterName && profile.pro;
  };

  // Track publishing status
  const getTrackStatus = (trackId) => {
    if (publishingData[trackId]) return 'complete';
    return 'pending';
  };

  const getCompletedCount = () => {
    return Object.keys(publishingData).length;
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'Work Title', 'Alternative Title', 'ISWC', 
      'Writer 1 Name', 'Writer 1 IPI', 'Writer 1 Share', 'Writer 1 Publisher', 'Writer 1 Publisher IPI',
      'Writer 2 Name', 'Writer 2 IPI', 'Writer 2 Share', 'Writer 2 Publisher', 'Writer 2 Publisher IPI',
      'Writer 3 Name', 'Writer 3 IPI', 'Writer 3 Share', 'Writer 3 Publisher', 'Writer 3 Publisher IPI',
      'Writer 4 Name', 'Writer 4 IPI', 'Writer 4 Share', 'Writer 4 Publisher', 'Writer 4 Publisher IPI',
      'Contains Sample', 'Sample Details', 'ISRC', 'Release Title', 'Release Date'
    ];

    const rows = Object.entries(publishingData).map(([trackId, data]) => {
      const track = mockRelease.tracks.find(t => t.id === trackId);
      const writers = data.writers || [];
      
      // Use alt title from track data if available, otherwise from form data
      const altTitle = track.altTitle || data.altTitles || '';
      
      const row = [
        data.title || track.title,
        altTitle,
        data.iswc || '',
      ];

      // Add up to 4 writers
      for (let i = 0; i < 4; i++) {
        if (writers[i]) {
          row.push(writers[i].name, writers[i].ipi || '', writers[i].split, writers[i].publisher || '', writers[i].publisherIpi || '');
        } else {
          row.push('', '', '', '', '');
        }
      }

      row.push(
        data.hasSamples ? 'Yes' : 'No',
        data.sampleDetails || '',
        track.isrc,
        mockRelease.title,
        mockRelease.release_date
      );

      return row;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mockRelease.title.replace(/\s+/g, '_')}_publishing_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render functions for each screen
  const renderProfileSetup = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Songwriter Profile</h1>
          <p className="text-gray-500 mt-2">Set up your publishing details to enable royalty collection</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Legal Name *</label>
            <input
              type="text"
              value={profile.songwriterName}
              onChange={(e) => updateProfile('songwriterName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="As registered with your PRO"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PRO Affiliation *</label>
              <select
                value={profile.pro}
                onChange={(e) => updateProfile('pro', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Select PRO...</option>
                <option value="ASCAP">ASCAP (USA)</option>
                <option value="BMI">BMI (USA)</option>
                <option value="SESAC">SESAC (USA)</option>
                <option value="PRS">PRS for Music (UK)</option>
                <option value="GEMA">GEMA (Germany)</option>
                <option value="SACEM">SACEM (France)</option>
                <option value="SGAE">SGAE (Spain)</option>
                <option value="SIAE">SIAE (Italy)</option>
                <option value="SACM">SACM (Mexico)</option>
                <option value="SOCAN">SOCAN (Canada)</option>
                <option value="APRA">APRA AMCOS (AU/NZ)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PRO Member ID</label>
              <input
                type="text"
                value={profile.proMemberId}
                onChange={(e) => updateProfile('proMemberId', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IPI Number</label>
            <input
              type="text"
              value={profile.ipi}
              onChange={(e) => updateProfile('ipi', e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono"
              placeholder="9-11 digits (if known)"
            />
            <p className="text-xs text-gray-500 mt-1">Your IPI can be found on your PRO statement or member portal</p>
          </div>

          <div className="border-t pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Publishing Arrangement</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="publisherType"
                  value="self"
                  checked={profile.publisherType === 'self'}
                  onChange={(e) => updateProfile('publisherType', e.target.value)}
                  className="text-pink-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Self-published</div>
                  <div className="text-sm text-gray-500">I control my own publishing</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="publisherType"
                  value="external"
                  checked={profile.publisherType === 'external'}
                  onChange={(e) => updateProfile('publisherType', e.target.value)}
                  className="text-pink-600"
                />
                <div>
                  <div className="font-medium text-gray-900">External publisher</div>
                  <div className="text-sm text-gray-500">I have a publishing deal</div>
                </div>
              </label>
            </div>
          </div>

          {profile.publisherType === 'self' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publishing Entity Name</label>
              <input
                type="text"
                value={profile.publisherName}
                onChange={(e) => updateProfile('publisherName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Optional - defaults to your name"
              />
            </div>
          )}

          {profile.publisherType === 'external' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher Name *</label>
                <input
                  type="text"
                  value={profile.publisherName}
                  onChange={(e) => updateProfile('publisherName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher IPI</label>
                <input
                  type="text"
                  value={profile.publisherIpi}
                  onChange={(e) => updateProfile('publisherIpi', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono ${
                    profile.publisherIpi && (profile.publisherIpi.length < 9 || profile.publisherIpi.length > 11) 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="If known"
                />
                {profile.publisherIpi && (profile.publisherIpi.length < 9 || profile.publisherIpi.length > 11) && (
                  <p className="text-xs text-red-500 mt-1">IPI must be 9-11 digits</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setScreen(SCREENS.RELEASE_VIEW)}
            disabled={!isProfileComplete()}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            Continue to Release
          </button>
        </div>
      </div>
    </div>
  );

  const renderReleaseView = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold">
              {profile.songwriterName.charAt(0)}
            </div>
            <div>
              <div className="text-gray-900 font-medium">{profile.songwriterName}</div>
              <div className="text-gray-500 text-sm">{profile.pro} {profile.ipi && `• ${profile.ipi}`}</div>
            </div>
          </div>
          <button
            onClick={() => setScreen(SCREENS.PROFILE_SETUP)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Edit Profile
          </button>
        </div>

        {/* Release Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Release Header */}
          <div className="bg-white border-b p-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-gray-500 text-sm">{mockRelease.label}</div>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{mockRelease.title}</h1>
                <div className="text-gray-600 mt-1">{mockRelease.artist}</div>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-gray-500 text-sm">{mockRelease.tracks.length} tracks</span>
                  <span className="text-gray-500 text-sm">Release: {mockRelease.release_date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Publishing Status Banner */}
          <div className="bg-pink-50 border-b border-pink-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-pink-900">Publishing Registration</div>
                  <div className="text-sm text-pink-600">{getCompletedCount()} of {mockRelease.tracks.length} tracks ready</div>
                </div>
              </div>
              {getCompletedCount() > 0 && (
                <button
                  onClick={() => setScreen(SCREENS.EXPORT_VIEW)}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  View & Export
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action */}
          {getCompletedCount() === 0 && (
            <div className="px-6 py-4 border-b bg-pink-50">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-pink-900">Same writers for all tracks?</div>
                  <div className="text-sm text-pink-600">Save time by entering details once</div>
                </div>
                <button
                  onClick={() => startCapture(0, 'same')}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors whitespace-nowrap"
                >
                  Yes, apply to all
                </button>
              </div>
            </div>
          )}

          {/* Track List */}
          <div className="divide-y">
            {mockRelease.tracks.map((track, index) => {
              const status = getTrackStatus(track.id);
              return (
                <div key={track.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{track.title}</div>
                    <div className="text-sm text-gray-500 truncate">{track.performers}</div>
                  </div>
                  <div className="text-sm text-gray-400 hidden sm:block">{track.duration}</div>
                  <div className="text-sm text-gray-400 font-mono hidden md:block">{track.isrc}</div>
                  <div className="flex items-center gap-2">
                    {status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ready
                      </span>
                    ) : (
                      <button
                        onClick={() => startCapture(index, 'different')}
                        className="px-3 py-1 border border-pink-300 text-pink-600 rounded-full text-sm hover:bg-pink-50 transition-colors"
                      >
                        Add Publishing
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPublishingCapture = () => {
    const track = mockRelease.tracks[currentTrackIndex];
    
    const updateCaptureField = (field, value) => {
      setCaptureFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateCoWriter = (index, field, value) => {
      setCaptureFormData(prev => {
        const newCoWriters = [...prev.coWriters];
        newCoWriters[index] = { ...newCoWriters[index], [field]: value };
        return { ...prev, coWriters: newCoWriters };
      });
    };

    const parseSplit = (value) => {
      if (!value) return 0;
      // Handle both . and , as decimal separators
      const normalized = String(value).replace(',', '.');
      return parseFloat(normalized) || 0;
    };

    const totalSplit = () => {
      let total = parseSplit(captureFormData.ownershipSplit);
      if (captureFormData.hasCoWriters) {
        for (let i = 0; i < captureFormData.coWriterCount; i++) {
          total += parseSplit(captureFormData.coWriters[i].split);
        }
      }
      // Round to 3 decimal places to avoid floating point issues
      return Math.round(total * 1000) / 1000;
    };

    const saveAndContinue = () => {
      // Build writers array
      const writers = [{
        name: profile.songwriterName,
        ipi: profile.ipi,
        split: captureFormData.ownershipSplit,
        publisher: profile.publisherName || profile.songwriterName,
        publisherIpi: profile.publisherIpi
      }];

      if (captureFormData.hasCoWriters) {
        for (let i = 0; i < captureFormData.coWriterCount; i++) {
          if (captureFormData.coWriters[i].name) {
            writers.push(captureFormData.coWriters[i]);
          }
        }
      }

      const trackData = {
        title: captureFormData.title,
        altTitles: captureFormData.altTitles,
        iswc: captureFormData.iswc,
        writers,
        hasSamples: captureFormData.hasSamples,
        sampleDetails: captureFormData.sampleDetails
      };

      // If bulk mode "same", save writer data for reuse and apply to all tracks
      if (bulkMode === 'same' && currentTrackIndex === 0) {
        setBulkWriterData({
          ownershipSplit: captureFormData.ownershipSplit,
          hasCoWriters: captureFormData.hasCoWriters,
          coWriterCount: captureFormData.coWriterCount,
          coWriters: captureFormData.coWriters
        });

        // Apply to all tracks
        const allData = {};
        mockRelease.tracks.forEach(t => {
          allData[t.id] = {
            ...trackData,
            title: t.title
          };
        });
        setPublishingData(allData);
        setScreen(SCREENS.RELEASE_VIEW);
      } else {
        // Single track
        setPublishingData(prev => ({
          ...prev,
          [track.id]: trackData
        }));
        setScreen(SCREENS.RELEASE_VIEW);
      }
    };

    const renderStepContent = () => {
      switch (captureStep) {
        case 0:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {bulkMode === 'same' ? 'Publishing for All Tracks' : track.title}
                </h2>
                <p className="text-gray-500 mt-1">
                  {bulkMode === 'same' 
                    ? `Apply the same writer information to all ${mockRelease.tracks.length} tracks`
                    : 'Add publishing information for this composition'
                  }
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-medium">
                    {profile.songwriterName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{profile.songwriterName}</div>
                    <div className="text-sm text-gray-500">{profile.pro} {profile.ipi && `• ${profile.ipi}`}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your ownership share</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={captureFormData.ownershipSplit}
                    onChange={(e) => {
                      // Allow digits, single decimal point or comma, up to 3 decimal places
                      let value = e.target.value.replace(/[^0-9.,]/g, '').replace(/([.,].*)[.,]/g, '$1');
                      // Normalize comma to period for display
                      value = value.replace(',', '.');
                      const parts = value.split('.');
                      if (parts[1] && parts[1].length > 3) return; // Max 3 decimal places
                      const num = parseFloat(value);
                      if (value && !isNaN(num) && num > 100) return; // Max 100
                      updateCaptureField('ownershipSplit', value);
                    }}
                    className="w-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-xl font-medium"
                    placeholder="100"
                  />
                  <span className="text-xl text-gray-500">%</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">If you're the sole writer, enter 100</p>
              </div>

              <button
                onClick={() => setCaptureStep(1)}
                disabled={!captureFormData.ownershipSplit}
                className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          );

        case 1:
          const normalizedSplit = String(captureFormData.ownershipSplit).replace(',', '.');
          const isSoleWriterWithWrongSplit = parseFloat(normalizedSplit) !== 100;
          
          const clearCoWritersAndContinue = () => {
            updateCaptureField('hasCoWriters', false);
            updateCaptureField('showSplitError', false);
            updateCaptureField('coWriterCount', 1);
            updateCaptureField('coWriters', [
              { name: '', ipi: '', split: '', publisher: '' },
              { name: '', ipi: '', split: '', publisher: '' },
              { name: '', ipi: '', split: '', publisher: '' },
              { name: '', ipi: '', split: '', publisher: '' }
            ]);
            setCaptureStep(3);
          };
          
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Co-Writers</h2>
                <p className="text-gray-500 mt-1">Are there other writers on {bulkMode === 'same' ? 'these compositions' : 'this composition'}?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { 
                    if (isSoleWriterWithWrongSplit) {
                      updateCaptureField('showSplitError', true);
                    } else {
                      clearCoWritersAndContinue();
                    }
                  }}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                >
                  <span className="font-medium">No, sole writer</span>
                </button>
                <button
                  onClick={() => { updateCaptureField('hasCoWriters', true); updateCaptureField('showSplitError', false); setCaptureStep(2); }}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                >
                  <span className="font-medium">Yes, add co-writers</span>
                </button>
              </div>

              {captureFormData.showSplitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-red-800">Ownership split doesn't add up</p>
                      <p className="text-sm text-red-700 mt-1">
                        You entered {captureFormData.ownershipSplit}% ownership but indicated you're the sole writer. Sole writers should have 100%.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { 
                            updateCaptureField('ownershipSplit', '100'); 
                            clearCoWritersAndContinue();
                          }}
                          className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Set to 100%
                        </button>
                        <button
                          onClick={() => { 
                            updateCaptureField('hasCoWriters', true); 
                            updateCaptureField('showSplitError', false);
                            setCaptureStep(2); 
                          }}
                          className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Add co-writers
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Co-Writer Details</h2>
                <p className="text-gray-500 mt-1">Add information for each co-writer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of co-writers</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCaptureField('coWriterCount', Math.max(1, captureFormData.coWriterCount - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >-</button>
                  <span className="text-xl font-medium w-8 text-center">{captureFormData.coWriterCount}</span>
                  <button
                    onClick={() => updateCaptureField('coWriterCount', Math.min(4, captureFormData.coWriterCount + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >+</button>
                </div>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {[...Array(captureFormData.coWriterCount)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 mb-3">Co-Writer {i + 1}</div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={captureFormData.coWriters[i].name}
                        onChange={(e) => updateCoWriter(i, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Full legal name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={captureFormData.coWriters[i].ipi}
                            onChange={(e) => updateCoWriter(i, 'ipi', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            className={`w-full p-2 border rounded-lg text-sm font-mono ${
                              captureFormData.coWriters[i].ipi && (captureFormData.coWriters[i].ipi.length < 9 || captureFormData.coWriters[i].ipi.length > 11)
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                            placeholder="IPI (optional)"
                          />
                          {captureFormData.coWriters[i].ipi && (captureFormData.coWriters[i].ipi.length < 9 || captureFormData.coWriters[i].ipi.length > 11) && (
                            <p className="text-xs text-red-500 mt-1">9-11 digits</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={captureFormData.coWriters[i].split}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.,]/g, '').replace(/([.,].*)[.,]/g, '$1');
                              // Normalize comma to period for display
                              value = value.replace(',', '.');
                              const parts = value.split('.');
                              if (parts[1] && parts[1].length > 3) return;
                              const num = parseFloat(value);
                              if (value && !isNaN(num) && num > 100) return;
                              updateCoWriter(i, 'split', value);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Split"
                          />
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-xl ${totalSplit() === 100 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={totalSplit() === 100 ? 'text-green-700' : 'text-amber-700'}>Total splits</span>
                  <span className={`font-mono font-medium ${totalSplit() === 100 ? 'text-green-700' : 'text-amber-700'}`}>{totalSplit()}%</span>
                </div>
              </div>

              <button
                onClick={() => setCaptureStep(3)}
                disabled={totalSplit() !== 100}
                className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Samples & Interpolations</h2>
                <p className="text-gray-500 mt-1">{bulkMode === 'same' ? 'Do any tracks contain' : 'Does this composition contain'} sampled material?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { updateCaptureField('hasSamples', false); setCaptureStep(4); }}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                >
                  <span className="font-medium">No samples</span>
                </button>
                <button
                  onClick={() => updateCaptureField('hasSamples', true)}
                  className={`p-4 rounded-xl border-2 transition-all ${captureFormData.hasSamples ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="font-medium">Yes</span>
                </button>
              </div>

              {captureFormData.hasSamples && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Sample details</label>
                  <textarea
                    value={captureFormData.sampleDetails}
                    onChange={(e) => updateCaptureField('sampleDetails', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl resize-none"
                    rows={3}
                    placeholder="Original song, writers, cleared status"
                  />
                  <button
                    onClick={() => setCaptureStep(4)}
                    className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          );

        case 4:
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Confirm & Submit</h2>
                <p className="text-gray-500 mt-1">Review your publishing information</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    {bulkMode === 'same' ? `${mockRelease.tracks.length} Tracks` : 'Track'}
                  </div>
                  <div className="font-medium text-gray-900">
                    {bulkMode === 'same' ? mockRelease.title : track.title}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Writers</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900">{profile.songwriterName}</span>
                      <span className="font-medium">{captureFormData.ownershipSplit}%</span>
                    </div>
                    {captureFormData.hasCoWriters && captureFormData.coWriters.slice(0, captureFormData.coWriterCount).map((cw, i) => (
                      cw.name && (
                        <div key={i} className="flex justify-between">
                          <span className="text-gray-900">{cw.name}</span>
                          <span className="font-medium">{cw.split}%</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                <p className="text-sm text-pink-900">
                  I confirm this information is accurate and authorize the registration of {bulkMode === 'same' ? 'these compositions' : 'this composition'} with collection societies.
                </p>
              </div>

              <button
                onClick={saveAndContinue}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-fuchsia-700 transition-all"
              >
                {bulkMode === 'same' ? `Submit All ${mockRelease.tracks.length} Tracks` : 'Submit'}
              </button>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full relative">
          {captureStep > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCaptureStep(s => s - 1)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400">Step {captureStep + 1} of 5</span>
                <button onClick={() => setScreen(SCREENS.RELEASE_VIEW)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-1 bg-gray-200 rounded-full">
                <div className="h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all" style={{ width: `${((captureStep + 1) / 5) * 100}%` }} />
              </div>
            </div>
          )}
          {captureStep === 0 && (
            <button onClick={() => setScreen(SCREENS.RELEASE_VIEW)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {renderStepContent()}
        </div>
      </div>
    );
  };

  const renderExportView = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setScreen(SCREENS.RELEASE_VIEW)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Release
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Publishing Data Export</h1>
                <p className="text-gray-500 mt-1">{mockRelease.title} • {getCompletedCount()} tracks ready</p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-fuchsia-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Track</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Writers</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">ISRC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockRelease.tracks.map(track => {
                    const data = publishingData[track.id];
                    if (!data) return null;
                    return (
                      <tr key={track.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{track.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {data.writers.map((w, i) => (
                              <div key={i} className="text-gray-600">
                                {w.name} ({w.split}%)
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">{track.isrc}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Ready
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border-t">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Data Submitted</div>
                <p className="text-sm text-gray-600 mt-1">
                  Your publishing information has been sent to your administrator for registration with collection societies. 
                  An ISWC (International Standard Musical Work Code) will be assigned to each composition upon successful registration.
                  You'll receive confirmation once your works have been registered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  switch (screen) {
    case SCREENS.PROFILE_SETUP:
      return renderProfileSetup();
    case SCREENS.RELEASE_VIEW:
      return renderReleaseView();
    case SCREENS.PUBLISHING_CAPTURE:
      return renderPublishingCapture();
    case SCREENS.EXPORT_VIEW:
      return renderExportView();
    default:
      return renderProfileSetup();
  }
}

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Medal, Users, Edit3, Save, X, Plus, Upload } from 'lucide-react';

import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { listRaceResults, getRaceResult } from './graphql/queries';
import { createRaceResult, updateRaceResult, deleteRaceResult } from './graphql/mutations';

const client = generateClient();

const RampartRagerWebsite = () => {
  const [activeRace, setActiveRace] = useState('100K');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingRunner, setEditingRunner] = useState(null);
  const [showAddRunner, setShowAddRunner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newRunner, setNewRunner] = useState({
    bib: '',
    firstName: '',
    lastName: '',
    elapsedTime: '',
    category: 'Open',
    gender: 'MALE'
  });

  // Sample data based on your Excel file structure
  // This will be replaced by AWS API calls when you set up the backend
  const [raceData, setRaceData] = useState({
    '100K': [
      { bib: 2, firstName: 'Jared', lastName: 'Black', elapsedTime: '9:01:00', category: 'Veteran', gender: 'MALE', place: 1 },
      { bib: 3, firstName: 'Landry', lastName: 'Bobo', elapsedTime: '9:02:00', category: 'Open', gender: 'MALE', place: 2 },
      { bib: 4, firstName: 'Paul', lastName: 'Brehm', elapsedTime: '9:03:00', category: 'Veteran', gender: 'MALE', place: 3 },
      { bib: 5, firstName: 'William', lastName: 'Burke', elapsedTime: '9:04:00', category: 'Masters', gender: 'MALE', place: 4 },
      { bib: 8, firstName: 'Max', lastName: 'Cohen', elapsedTime: '9:07:00', category: 'Open', gender: 'MALE', place: 5 },
      { bib: 9, firstName: 'Jim', lastName: 'Copeland', elapsedTime: '9:08:00', category: 'Masters', gender: 'MALE', place: 6 },
    ],
    '70K': [
      { bib: 6, firstName: 'Neil', lastName: 'Cestra', elapsedTime: '9:05:00', category: 'Masters', gender: 'MALE', place: 1 },
      { bib: 12, firstName: 'Richard', lastName: 'Crocker', elapsedTime: '9:11:00', category: 'Masters', gender: 'MALE', place: 2 },
      { bib: 15, firstName: 'Ken', lastName: 'Dunn', elapsedTime: '9:14:00', category: 'Open', gender: 'MALE', place: 3 },
    ],
    '50K': [
      { bib: 7, firstName: 'Samuel', lastName: 'Chew', elapsedTime: '9:06:00', category: 'Open', gender: 'MALE', place: 1 },
      { bib: 19, firstName: 'Christopher', lastName: 'Fife', elapsedTime: '9:18:00', category: 'Veteran', gender: 'MALE', place: 2 },
      { bib: 22, firstName: 'Chris', lastName: 'Fowler', elapsedTime: '9:21:00', category: 'Masters', gender: 'MALE', place: 3 },
    ]
  });

  const categories = ['Open', 'Masters', 'Veteran'];
  const races = ['100K', '70K', '50K'];

  // Load race data from AWS API
  useEffect(() => {
    loadRaceData();
  }, []);

  // AWS API integration functions
  const loadRaceData = async () => {
    try {
      setLoading(true);
      const newRaceData = { ...raceData }; // Start with existing data
      
      for (const race of races) {
        try {
          const response = await client.graphql({
            query: listRaceResults,
            variables: { filter: { race: { eq: race } } }
          });
          
          const results = response.data.listRaceResults.items || [];
          // Only update if we actually have results
          if (results.length > 0) {
            // Sort by place
            results.sort((a, b) => a.place - b.place);
            newRaceData[race] = results;
          }
        } catch (raceError) {
          console.log(`No results found for ${race}, keeping existing data`);
          // Don't overwrite with empty array - keep existing data
        }
      }
      
      setRaceData(newRaceData);
    } catch (error) {
      console.error('Error loading race data:', error);
      console.log('Keeping existing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const updateRunnerInDB = async (runner) => {
    try {
      await client.graphql({
        query: updateRaceResult,
        variables: {
          input: {
            id: runner.id,
            firstName: runner.firstName,
            lastName: runner.lastName,
            elapsedTime: runner.elapsedTime,
            category: runner.category,
            gender: runner.gender,
            place: runner.place
          }
        }
      });
      
      // Reload data
      loadRaceData();
      alert('Runner updated successfully!');
    } catch (error) {
      console.error('Error updating runner:', error);
      alert('Error updating runner. Please try again.');
    }
  };

  const handleAWSFileUpload = async (file) => {
    try {
      setUploading(true);
      
      // Upload to S3 - this will trigger the Lambda function
      const result = await uploadData({
        key: `race-results/${Date.now()}-${file.name}`,
        data: file,
        options: {
          contentType: file.type
        }
      });
      
      await result.result;
      
      alert('File uploaded successfully! Results will be updated shortly.');
      
      // Reload data after a short delay to allow processing
      setTimeout(() => {
        loadRaceData();
      }, 5000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'DNF';
    return timeString;
  };

  const getPlaceIcon = (place) => {
    switch(place) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{place}</span>;
    }
  };

  const getCategoryWinners = (race) => {
    const runners = raceData[race] || [];
    const categoryWinners = {};
    
    categories.forEach(category => {
      const categoryRunners = runners
        .filter(runner => runner.category === category)
        .sort((a, b) => a.place - b.place);
      
      if (categoryRunners.length > 0) {
        categoryWinners[category] = categoryRunners[0];
      }
    });
    
    return categoryWinners;
  };

  const getOverallWinners = (race) => {
    const runners = raceData[race] || [];
    return runners
      .sort((a, b) => a.place - b.place)
      .slice(0, 3);
  };

  const handleEditRunner = (runner) => {
    setEditingRunner({ ...runner });
  };

  const handleSaveEdit = async () => {
    try {
      // Update in AWS database
      await updateRunnerInDB(editingRunner);
      setEditingRunner(null);
    } catch (error) {
      console.error('Error saving runner:', error);
      // Fallback to local state update
      setRaceData(prev => ({
        ...prev,
        [activeRace]: prev[activeRace].map(runner => 
          runner.bib === editingRunner.bib ? editingRunner : runner
        )
      }));
      setEditingRunner(null);
      alert('Runner updated locally. Database update failed.');
    }
  };

  const handleAddRunner = async () => {
    try {
      const nextPlace = Math.max(...raceData[activeRace].map(r => r.place), 0) + 1;
      const runner = {
        ...newRunner,
        bib: parseInt(newRunner.bib),
        place: nextPlace,
        race: activeRace
      };
      
      // Create in AWS database
      await client.graphql({
        query: createRaceResult,
        variables: {
          input: runner
        }
      });
      
      // Reload data
      await loadRaceData();
      
      setNewRunner({
        bib: '',
        firstName: '',
        lastName: '',
        elapsedTime: '',
        category: 'Open',
        gender: 'MALE'
      });
      setShowAddRunner(false);
      
      alert('Runner added successfully!');
    } catch (error) {
      console.error('Error adding runner:', error);
      alert('Error adding runner. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Upload to AWS S3 and process
    await handleAWSFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-stone-800 mb-2">
            🏃‍♂️ Rampart Rager
          </h1>
          <p className="text-xl text-stone-600">Ultra Marathon Race Results</p>
        </div>

        {/* Admin Controls */}
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
              isAdminMode 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' 
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isAdminMode ? 'Exit Admin' : 'Admin Mode'}</span>
          </button>
          
          {isAdminMode && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddRunner(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-amber-700 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Runner</span>
              </button>
              
              <label className="px-4 py-2 bg-stone-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-stone-700 shadow-md transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Race Distance Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-amber-50 rounded-xl p-2 shadow-lg border border-amber-200">
            {races.map(race => (
              <button
                key={race}
                onClick={() => setActiveRace(race)}
                className={`px-6 py-3 mx-1 rounded-lg font-semibold transition-all ${
                  activeRace === race
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-stone-600 hover:bg-amber-100'
                }`}
              >
                {race}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Overall Winners */}
          <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              Overall Top 3 - {activeRace}
            </h2>
            
            <div className="space-y-4">
              {getOverallWinners(activeRace).map((runner, index) => (
                <div key={runner.bib} className="bg-amber-50 rounded-xl p-4 flex items-center justify-between border border-amber-100">
                  <div className="flex items-center space-x-4">
                    {getPlaceIcon(runner.place)}
                    <div>
                      <h3 className="text-lg font-semibold text-stone-800">
                        {runner.firstName} {runner.lastName}
                      </h3>
                      <p className="text-stone-600">
                        Bib #{runner.bib} • {runner.category} • {runner.gender}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-mono text-stone-800 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      {formatTime(runner.elapsedTime)}
                    </p>
                    {isAdminMode && (
                      <button
                        onClick={() => handleEditRunner(runner)}
                        className="mt-2 px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 shadow-sm transition-all"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Winners */}
          <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center">
              <Users className="w-8 h-8 text-green-500 mr-3" />
              Category Winners - {activeRace}
            </h2>
            
            <div className="space-y-4">
              {Object.entries(getCategoryWinners(activeRace)).map(([category, runner]) => (
                <div key={category} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-lg font-semibold text-orange-500 mb-2">{category}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-stone-800 font-semibold">
                          {runner.firstName} {runner.lastName}
                        </p>
                        <p className="text-stone-600 text-sm">
                          Bib #{runner.bib} • {runner.gender}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono text-stone-800">
                        {formatTime(runner.elapsedTime)}
                      </p>
                      {isAdminMode && (
                        <button
                          onClick={() => handleEditRunner(runner)}
                          className="mt-1 px-2 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-all"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Results Table */}
        <div className="mt-8 bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">All Results - {activeRace}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-stone-600 border-b border-stone-200">
                  <th className="pb-3">Place</th>
                  <th className="pb-3">Bib</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Time</th>
                  {isAdminMode && <th className="pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(raceData[activeRace] || []).map((runner) => (
                  <tr key={runner.bib} className="text-stone-800 border-b border-stone-200 hover:bg-stone-50">
                    <td className="py-3">{runner.place}</td>
                    <td className="py-3">{runner.bib}</td>
                    <td className="py-3">{runner.firstName} {runner.lastName}</td>
                    <td className="py-3">{runner.category}</td>
                    <td className="py-3 font-mono">{formatTime(runner.elapsedTime)}</td>
                    {isAdminMode && (
                      <td className="py-3">
                        <button
                          onClick={() => handleEditRunner(runner)}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 shadow-sm transition-all"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Runner Modal */}
      {editingRunner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Edit Runner</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First Name"
                value={editingRunner.firstName}
                onChange={(e) => setEditingRunner({...editingRunner, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={editingRunner.lastName}
                onChange={(e) => setEditingRunner({...editingRunner, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Elapsed Time (H:MM:SS)"
                value={editingRunner.elapsedTime}
                onChange={(e) => setEditingRunner({...editingRunner, elapsedTime: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <select
                value={editingRunner.category}
                onChange={(e) => setEditingRunner({...editingRunner, category: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
              <button
                onClick={() => setEditingRunner(null)}
                className="flex-1 bg-stone-500 text-white py-2 rounded-lg hover:bg-stone-600 shadow-md transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Runner Modal */}
      {showAddRunner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-50 rounded-xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Add New Runner</h3>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Bib Number"
                value={newRunner.bib}
                onChange={(e) => setNewRunner({...newRunner, bib: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="First Name"
                value={newRunner.firstName}
                onChange={(e) => setNewRunner({...newRunner, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newRunner.lastName}
                onChange={(e) => setNewRunner({...newRunner, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Elapsed Time (H:MM:SS)"
                value={newRunner.elapsedTime}
                onChange={(e) => setNewRunner({...newRunner, elapsedTime: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <select
                value={newRunner.category}
                onChange={(e) => setNewRunner({...newRunner, category: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newRunner.gender}
                onChange={(e) => setNewRunner({...newRunner, gender: e.target.value})}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddRunner}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 shadow-md transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Runner
              </button>
              <button
                onClick={() => setShowAddRunner(false)}
                className="flex-1 bg-stone-500 text-white py-2 rounded-lg hover:bg-stone-600 shadow-md transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RampartRagerWebsite;
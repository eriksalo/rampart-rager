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

  // Sample data - used as fallback if AWS fails
  const sampleRaceData = {
    '100K': [
      { bib: 1, firstName: 'Emma', lastName: 'Young', elapsedTime: '8:55:23', category: 'Junior', gender: 'FEMALE', place: 1 },
      { bib: 2, firstName: 'Jared', lastName: 'Black', elapsedTime: '9:01:15', category: 'Veteran', gender: 'MALE', place: 2 },
      { bib: 3, firstName: 'Landry', lastName: 'Bobo', elapsedTime: '9:02:30', category: 'Open', gender: 'MALE', place: 3 },
      { bib: 4, firstName: 'Paul', lastName: 'Brehm', elapsedTime: '9:03:45', category: 'Veteran', gender: 'MALE', place: 4 },
      { bib: 5, firstName: 'William', lastName: 'Burke', elapsedTime: '9:04:12', category: 'Masters', gender: 'MALE', place: 5 },
      { bib: 6, firstName: 'Sarah', lastName: 'Johnson', elapsedTime: '9:05:30', category: 'Open', gender: 'FEMALE', place: 6 },
      { bib: 8, firstName: 'Max', lastName: 'Cohen', elapsedTime: '9:07:45', category: 'Open', gender: 'MALE', place: 7 },
      { bib: 9, firstName: 'Jim', lastName: 'Copeland', elapsedTime: '9:08:22', category: 'Masters', gender: 'MALE', place: 8 },
      { bib: 10, firstName: 'Tyler', lastName: 'Swift', elapsedTime: '9:12:15', category: 'Junior', gender: 'MALE', place: 9 },
      { bib: 11, firstName: 'Lisa', lastName: 'Martinez', elapsedTime: '9:15:30', category: 'Masters', gender: 'FEMALE', place: 10 },
      { bib: 12, firstName: 'Rachel', lastName: 'Thompson', elapsedTime: '9:22:45', category: 'Veteran', gender: 'FEMALE', place: 11 },
      { bib: 13, firstName: 'Mike', lastName: 'Johnson', elapsedTime: '9:35:12', category: 'Open', gender: 'MALE', place: 12 },
      { bib: 14, firstName: 'Anna', lastName: 'Wilson', elapsedTime: '9:42:30', category: 'Open', gender: 'FEMALE', place: 13 },
      { bib: 15, firstName: 'Tom', lastName: 'Anderson', elapsedTime: '9:48:15', category: 'Masters', gender: 'MALE', place: 14 },
      { bib: 16, firstName: 'Julie', lastName: 'Davis', elapsedTime: '9:55:45', category: 'Junior', gender: 'FEMALE', place: 15 },
      { bib: 17, firstName: 'Steve', lastName: 'Miller', elapsedTime: '10:12:30', category: 'Veteran', gender: 'MALE', place: 16 },
      { bib: 18, firstName: 'Karen', lastName: 'Brown', elapsedTime: '10:25:15', category: 'Masters', gender: 'FEMALE', place: 17 },
      { bib: 19, firstName: 'Dave', lastName: 'Taylor', elapsedTime: '10:38:45', category: 'Veteran', gender: 'MALE', place: 18 },
    ],
    '70K': [
      { bib: 21, firstName: 'Neil', lastName: 'Cestra', elapsedTime: '6:05:30', category: 'Masters', gender: 'MALE', place: 1 },
      { bib: 22, firstName: 'Sophie', lastName: 'Runner', elapsedTime: '6:09:45', category: 'Junior', gender: 'FEMALE', place: 2 },
      { bib: 23, firstName: 'Richard', lastName: 'Crocker', elapsedTime: '6:11:22', category: 'Masters', gender: 'MALE', place: 3 },
      { bib: 24, firstName: 'Ken', lastName: 'Dunn', elapsedTime: '6:14:15', category: 'Open', gender: 'MALE', place: 4 },
      { bib: 25, firstName: 'Jake', lastName: 'Fast', elapsedTime: '6:16:30', category: 'Junior', gender: 'MALE', place: 5 },
      { bib: 26, firstName: 'Maria', lastName: 'Garcia', elapsedTime: '6:22:45', category: 'Open', gender: 'FEMALE', place: 6 },
      { bib: 27, firstName: 'Bob', lastName: 'Smith', elapsedTime: '6:28:12', category: 'Veteran', gender: 'MALE', place: 7 },
      { bib: 28, firstName: 'Linda', lastName: 'Jones', elapsedTime: '6:35:30', category: 'Masters', gender: 'FEMALE', place: 8 },
      { bib: 29, firstName: 'Chris', lastName: 'Lee', elapsedTime: '6:42:15', category: 'Open', gender: 'MALE', place: 9 },
      { bib: 30, firstName: 'Amy', lastName: 'White', elapsedTime: '6:48:45', category: 'Junior', gender: 'FEMALE', place: 10 },
      { bib: 31, firstName: 'Mark', lastName: 'Wilson', elapsedTime: '6:55:22', category: 'Veteran', gender: 'MALE', place: 11 },
      { bib: 32, firstName: 'Diana', lastName: 'Clark', elapsedTime: '7:02:30', category: 'Masters', gender: 'FEMALE', place: 12 },
    ],
    '50K': [
      { bib: 41, firstName: 'Samuel', lastName: 'Chew', elapsedTime: '4:06:30', category: 'Open', gender: 'MALE', place: 1 },
      { bib: 42, firstName: 'Mia', lastName: 'Quick', elapsedTime: '4:15:45', category: 'Junior', gender: 'FEMALE', place: 2 },
      { bib: 43, firstName: 'Christopher', lastName: 'Fife', elapsedTime: '4:18:22', category: 'Veteran', gender: 'MALE', place: 3 },
      { bib: 44, firstName: 'Chris', lastName: 'Fowler', elapsedTime: '4:21:15', category: 'Masters', gender: 'MALE', place: 4 },
      { bib: 45, firstName: 'Alex', lastName: 'Sprint', elapsedTime: '4:25:30', category: 'Junior', gender: 'MALE', place: 5 },
      { bib: 46, firstName: 'Jessica', lastName: 'Turner', elapsedTime: '4:32:15', category: 'Open', gender: 'FEMALE', place: 6 },
      { bib: 47, firstName: 'Robert', lastName: 'Green', elapsedTime: '4:38:45', category: 'Masters', gender: 'MALE', place: 7 },
      { bib: 48, firstName: 'Sarah', lastName: 'Adams', elapsedTime: '4:42:30', category: 'Open', gender: 'FEMALE', place: 8 },
      { bib: 49, firstName: 'John', lastName: 'Moore', elapsedTime: '4:48:15', category: 'Veteran', gender: 'MALE', place: 9 },
      { bib: 50, firstName: 'Emily', lastName: 'Hall', elapsedTime: '4:55:22', category: 'Junior', gender: 'FEMALE', place: 10 },
      { bib: 51, firstName: 'Peter', lastName: 'King', elapsedTime: '5:02:45', category: 'Masters', gender: 'MALE', place: 11 },
      { bib: 52, firstName: 'Laura', lastName: 'Scott', elapsedTime: '5:08:30', category: 'Masters', gender: 'FEMALE', place: 12 },
      { bib: 53, firstName: 'Dan', lastName: 'Phillips', elapsedTime: '5:15:15', category: 'Veteran', gender: 'MALE', place: 13 },
      { bib: 54, firstName: 'Rachel', lastName: 'Evans', elapsedTime: '5:22:45', category: 'Open', gender: 'FEMALE', place: 14 },
    ],
    'KOM': [
      { bib: 101, firstName: 'Alex', lastName: 'Mountain', elapsedTime: '0:45:30', category: 'Open', gender: 'MALE', place: 1 },
      { bib: 102, firstName: 'Sarah', lastName: 'Peak', elapsedTime: '0:52:15', category: 'Open', gender: 'FEMALE', place: 2 },
      { bib: 103, firstName: 'Mike', lastName: 'Summit', elapsedTime: '0:48:20', category: 'Veteran', gender: 'MALE', place: 3 },
      { bib: 104, firstName: 'Lisa', lastName: 'Ridge', elapsedTime: '0:55:45', category: 'Masters', gender: 'FEMALE', place: 4 },
      { bib: 105, firstName: 'Zoe', lastName: 'Climb', elapsedTime: '0:49:30', category: 'Junior', gender: 'FEMALE', place: 5 },
      { bib: 106, firstName: 'Ryan', lastName: 'Hill', elapsedTime: '0:51:15', category: 'Junior', gender: 'MALE', place: 6 },
    ]
  };

  // Start with empty data state
  const [raceData, setRaceData] = useState({});

  const categories = ['Junior', 'Open', 'Masters', 'Veteran'];
  const races = ['100K', '70K', '50K', 'KOM'];

  // Helper function to parse elapsed time
  const parseElapsedTime = (timeString) => {
    if (!timeString) return Infinity; // Put entries without times at the end
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
    }
    
    return Infinity;
  };

  // Load race data from AWS API
  useEffect(() => {
    loadRaceData();
  }, []);

  // AWS API integration functions
  const loadRaceData = async () => {
    try {
      setLoading(true);
      const newRaceData = {};
      let hasAnyAWSData = false;
      
      // Try to load data from AWS for each race
      for (const race of races) {
        try {
          const response = await client.graphql({
            query: listRaceResults,
            variables: { filter: { race: { eq: race } } }
          });
          
          const results = response.data.listRaceResults.items || [];
          if (results.length > 0) {
            // Sort by elapsed time (AWS data should already be sorted by place)
            results.sort((a, b) => {
              const timeA = parseElapsedTime(a.elapsedTime);
              const timeB = parseElapsedTime(b.elapsedTime);
              return timeA - timeB;
            });
            newRaceData[race] = results;
            hasAnyAWSData = true;
            console.log(`Loaded ${results.length} results for ${race} from AWS`);
          }
        } catch (raceError) {
          console.log(`No AWS results found for ${race}`);
        }
      }
      
      // If we got any AWS data, use it. Otherwise, fall back to sample data
      if (hasAnyAWSData) {
        // Fill in missing races with empty arrays
        races.forEach(race => {
          if (!newRaceData[race]) {
            newRaceData[race] = [];
          }
        });
        setRaceData(newRaceData);
        console.log('Using AWS data');
      } else {
        setRaceData(sampleRaceData);
        console.log('No AWS data available, using sample data');
      }
    } catch (error) {
      console.error('Error loading race data:', error);
      console.log('Falling back to sample data due to error');
      setRaceData(sampleRaceData);
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
      
      console.log('=== React Upload Started ===');
      console.log('File name:', file.name);
      console.log('File size:', file.size);
      console.log('File type:', file.type);
      
      // Clear existing data immediately to show user that upload is replacing all data
      setRaceData({});
      
      // Create a clean filename for S3
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `race-results/${Date.now()}-${cleanFileName}`;
      
      console.log('S3 key:', s3Key);
      
      // Upload to S3 - this will trigger the Lambda function
      const result = await uploadData({
        key: s3Key,
        data: file,
        options: {
          contentType: file.type || 'text/csv'
        }
      });
      
      console.log('Upload initiated...');
      await result.result;
      console.log('Upload completed to S3');
      
      alert('File uploaded successfully! Processing results...');
      
      // Reload data after a short delay to allow processing
      setTimeout(() => {
        console.log('Reloading race data...');
        loadRaceData();
      }, 10000); // Increased time to allow for clearing + processing
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error.message}`);
      // Reload existing data if upload failed
      loadRaceData();
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
        .sort((a, b) => {
          const timeA = parseElapsedTime(a.elapsedTime);
          const timeB = parseElapsedTime(b.elapsedTime);
          return timeA - timeB;
        });
      
      if (categoryRunners.length > 0) {
        categoryWinners[category] = categoryRunners[0];
      }
    });
    
    return categoryWinners;
  };

  const getOverallWinners = (race) => {
    const runners = raceData[race] || [];
    return runners
      .sort((a, b) => {
        const timeA = parseElapsedTime(a.elapsedTime);
        const timeB = parseElapsedTime(b.elapsedTime);
        return timeA - timeB;
      })
      .slice(0, 3);
  };

  const getGenderResults = (race, gender) => {
    const runners = raceData[race] || [];
    return runners
      .filter(runner => runner.gender === gender)
      .sort((a, b) => {
        const timeA = parseElapsedTime(a.elapsedTime);
        const timeB = parseElapsedTime(b.elapsedTime);
        return timeA - timeB;
      });
  };

  const getCategoryGenderResults = (race, category, gender) => {
    const runners = raceData[race] || [];
    return runners
      .filter(runner => runner.category === category && runner.gender === gender)
      .sort((a, b) => {
        const timeA = parseElapsedTime(a.elapsedTime);
        const timeB = parseElapsedTime(b.elapsedTime);
        return timeA - timeB;
      });
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

  const handleAdminModeToggle = () => {
    if (isAdminMode) {
      // If already in admin mode, just exit
      setIsAdminMode(false);
    } else {
      // Prompt for password to enter admin mode
      const password = prompt('Enter admin password:');
      if (password === 'cat') {
        setIsAdminMode(true);
      } else if (password !== null) {
        alert('Incorrect password');
      }
    }
  };

  // Show loading or uploading state
  if (loading || uploading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">🏃‍♂️ Rampart Rager</h1>
          <p className="text-lg text-stone-600">
            {uploading ? 'Processing Excel file and updating results...' : 'Loading race results...'}
          </p>
          {uploading && (
            <p className="text-sm text-stone-500 mt-2">
              This will replace all existing results with the new Excel data.
            </p>
          )}
        </div>
      </div>
    );
  }

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
        {isAdminMode && (
          <div className="mb-6 flex justify-center space-x-4">
            <button
              onClick={() => setShowAddRunner(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-amber-700 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Runner</span>
            </button>
            
            <label className="px-4 py-2 bg-stone-600 text-white rounded-lg font-semibold flex items-center space-x-2 hover:bg-stone-700 shadow-md transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

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
                    {getPlaceIcon(index + 1)}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Men and Women Results */}
        <div className="mt-8 grid lg:grid-cols-2 gap-8">
          {/* Women Results */}
          <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Women - {activeRace}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-stone-600 border-b border-stone-200">
                    <th className="pb-3">Place</th>
                    <th className="pb-3">Bib</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {getGenderResults(activeRace, 'FEMALE').map((runner, index) => (
                    <tr key={runner.bib} className="text-stone-800 border-b border-stone-200 hover:bg-stone-50">
                      <td className="py-3">{runner.place}</td>
                      <td className="py-3">{runner.bib}</td>
                      <td className="py-3">{runner.firstName} {runner.lastName}</td>
                      <td className="py-3">{runner.category}</td>
                      <td className="py-3 font-mono">{formatTime(runner.elapsedTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Men Results */}
          <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">Men - {activeRace}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-stone-600 border-b border-stone-200">
                    <th className="pb-3">Place</th>
                    <th className="pb-3">Bib</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {getGenderResults(activeRace, 'MALE').map((runner, index) => (
                    <tr key={runner.bib} className="text-stone-800 border-b border-stone-200 hover:bg-stone-50">
                      <td className="py-3">{runner.place}</td>
                      <td className="py-3">{runner.bib}</td>
                      <td className="py-3">{runner.firstName} {runner.lastName}</td>
                      <td className="py-3">{runner.category}</td>
                      <td className="py-3 font-mono">{formatTime(runner.elapsedTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category Results */}
        {categories.map(category => (
          <div key={category} className="mt-8">
            <h2 className="text-3xl font-bold text-stone-800 mb-6 text-center">{category} Category - {activeRace}</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Women Category Results */}
              <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
                <h3 className="text-xl font-bold text-stone-800 mb-4">Women {category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-stone-600 border-b border-stone-200">
                        <th className="pb-3">Place</th>
                        <th className="pb-3">Bib</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCategoryGenderResults(activeRace, category, 'FEMALE').map((runner, index) => (
                        <tr key={runner.bib} className="text-stone-800 border-b border-stone-200 hover:bg-stone-50">
                          <td className="py-3">{runner.place}</td>
                          <td className="py-3">{runner.bib}</td>
                          <td className="py-3">{runner.firstName} {runner.lastName}</td>
                          <td className="py-3 font-mono">{formatTime(runner.elapsedTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getCategoryGenderResults(activeRace, category, 'FEMALE').length === 0 && (
                    <p className="text-stone-600 text-center py-4">No participants</p>
                  )}
                </div>
              </div>

              {/* Men Category Results */}
              <div className="bg-stone-50 rounded-2xl p-6 shadow-lg border border-stone-200">
                <h3 className="text-xl font-bold text-stone-800 mb-4">Men {category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-stone-600 border-b border-stone-200">
                        <th className="pb-3">Place</th>
                        <th className="pb-3">Bib</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCategoryGenderResults(activeRace, category, 'MALE').map((runner, index) => (
                        <tr key={runner.bib} className="text-stone-800 border-b border-stone-200 hover:bg-stone-50">
                          <td className="py-3">{runner.place}</td>
                          <td className="py-3">{runner.bib}</td>
                          <td className="py-3">{runner.firstName} {runner.lastName}</td>
                          <td className="py-3 font-mono">{formatTime(runner.elapsedTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getCategoryGenderResults(activeRace, category, 'MALE').length === 0 && (
                    <p className="text-stone-600 text-center py-4">No participants</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Admin Button - Center Bottom */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleAdminModeToggle}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
              isAdminMode 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg' 
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isAdminMode ? 'Exit Admin' : 'Admin Mode'}</span>
          </button>
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
// quick script to require models and ensure no syntax/runtime errors
try {
  require('../models/user');
  require('../models/room');
  require('../models/file');
  require('../models/tldrawState');
  require('../models/aiChat');
  console.log('ALL MODELS LOADED OK');
} catch (err) {
  console.error('MODEL LOAD ERROR', err);
  process.exit(1);
}

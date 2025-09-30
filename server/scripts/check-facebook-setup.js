const axios = require('axios');
require('dotenv').config();

const checkFacebookSetup = async () => {
  console.log('🔍 Checking Facebook Integration Setup...\n');

  // Check environment variables
  const requiredVars = [
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET', 
    'FACEBOOK_ACCESS_TOKEN',
    'FACEBOOK_WEBHOOK_VERIFY_TOKEN'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📋 Please add these to your server/.env file');
    return false;
  }

  console.log('✅ All environment variables present');

  // Check Facebook App ID format
  const appId = process.env.FACEBOOK_APP_ID;
  if (!/^\d+$/.test(appId)) {
    console.log('❌ Facebook App ID should be numeric');
    return false;
  }
  console.log(`✅ Facebook App ID: ${appId}`);

  // Test Facebook API connection
  try {
    console.log('\n🔗 Testing Facebook API connection...');
    
    const response = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        access_token: process.env.FACEBOOK_ACCESS_TOKEN,
        fields: 'id,name'
      }
    });

    console.log(`✅ Connected to Facebook API`);
    console.log(`   User: ${response.data.name} (ID: ${response.data.id})`);

  } catch (error) {
    console.log('❌ Facebook API connection failed:');
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      console.log(`   Error: ${fbError.message}`);
      console.log(`   Type: ${fbError.type}`);
      console.log(`   Code: ${fbError.code}`);
      
      if (fbError.code === 190) {
        console.log('\n💡 Access token is invalid or expired.');
        console.log('   Generate a new token at: https://developers.facebook.com/tools/explorer/');
      }
    } else {
      console.log(`   ${error.message}`);
    }
    return false;
  }

  // Test webhook verification token
  console.log('\n🔐 Webhook verification token configured');
  console.log(`   Token: ${process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN.substring(0, 5)}...`);

  // Check integration mode
  const integrationMode = process.env.FACEBOOK_INTEGRATION_MODE || 'auto';
  console.log(`\n⚙️ Integration Mode: ${integrationMode.toUpperCase()}`);
  
  if (integrationMode === 'auto') {
    console.log('🤖 AUTOMATIC mode enabled - Full Facebook automation active!');
    console.log('   ✅ Comments will be monitored automatically');
    console.log('   ✅ Bids will be detected and processed in real-time');
    console.log('   ✅ Notifications will be sent automatically');
  } else {
    console.log('📝 Manual mode enabled - Facebook automation disabled');
  }

  console.log('\n🎉 Facebook integration setup is complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start your server: npm run dev');
  console.log('2. Setup ngrok for webhooks: ngrok http 5000');
  console.log('3. Configure Facebook webhook with your ngrok URL');
  console.log('4. Create an auction and connect it to a Facebook post');
  console.log('5. Watch automatic bid detection in action! 🚀');

  return true;
};

// Test Facebook permissions
const checkPermissions = async () => {
  try {
    console.log('\n🔑 Checking Facebook permissions...');
    
    const response = await axios.get(`https://graph.facebook.com/v18.0/me/permissions`, {
      params: {
        access_token: process.env.FACEBOOK_ACCESS_TOKEN
      }
    });

    const permissions = response.data.data;
    const requiredPerms = ['pages_read_engagement', 'pages_manage_posts', 'pages_show_list'];
    
    console.log('📋 Current permissions:');
    permissions.forEach(perm => {
      const status = perm.status === 'granted' ? '✅' : '❌';
      console.log(`   ${status} ${perm.permission}`);
    });

    const missingPerms = requiredPerms.filter(reqPerm => 
      !permissions.find(perm => perm.permission === reqPerm && perm.status === 'granted')
    );

    if (missingPerms.length > 0) {
      console.log('\n⚠️ Missing required permissions:');
      missingPerms.forEach(perm => console.log(`   - ${perm}`));
      console.log('\n💡 Generate a new token with required permissions at:');
      console.log('   https://developers.facebook.com/tools/explorer/');
    } else {
      console.log('\n✅ All required permissions granted!');
    }

  } catch (error) {
    console.log('❌ Could not check permissions:', error.response?.data?.error?.message || error.message);
  }
};

// Run the checks
const runChecks = async () => {
  const setupOk = await checkFacebookSetup();
  
  if (setupOk) {
    await checkPermissions();
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (setupOk) {
    console.log('🎯 STATUS: Ready for AUTOMATIC Facebook auction management!');
  } else {
    console.log('⚠️ STATUS: Setup incomplete - please fix the issues above');
  }
};

runChecks().catch(console.error);

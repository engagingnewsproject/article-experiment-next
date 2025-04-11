const { updateArticlesWithSlugs } = require('../lib/firestore');

async function main() {
  try {
    console.log('Starting to update articles with slugs...');
    await updateArticlesWithSlugs();
    console.log('Finished updating articles with slugs!');
  } catch (error) {
    console.error('Error updating articles:', error);
  }
}

main(); 
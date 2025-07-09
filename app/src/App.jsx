import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bannedAttributes, setBannedAttributes] = useState([]);
  const [currentCat, setCurrentCat] = useState(null);
  
  const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_API_KEY
  });

  var requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  }
  const getCats = async () => {
    try {
      setLoading(true);
      let foundValidCat = false;
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loops
      
      while (!foundValidCat && attempts < maxAttempts) {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search?has_breeds=1&limit=1', requestOptions);
        const newCat = response.data[0];
        
        if (newCat && newCat.breeds && newCat.breeds.length > 0) {
          const breed = newCat.breeds[0];
          
          // Check if any of the cat's attributes are banned
          const catAttributes = {
            breed: breed.name,
            weight: breed.weight?.metric ? breed.weight.metric + ' kg' : 'Unknown',
            origin: breed.origin,
          };
          
          const hasBannedAttribute = Object.values(catAttributes).some(value => 
            bannedAttributes.includes(value)
          );
          
          if (!hasBannedAttribute) {
            setCats(prevCats => [...prevCats, newCat]);
            setCurrentCat(newCat);
            foundValidCat = true;
          }
        }
        
        attempts++;
      }
      
      if (!foundValidCat) {
        console.log('Could not find a cat without banned attributes after', maxAttempts, 'attempts');
      }
      
    } catch (error) {
      console.error('Error fetching cat images:', error);
    } finally {
      setLoading(false);
    }
}

  const getCurrentCat = () => {
    return currentCat || (cats.length > 0 ? cats[cats.length - 1] : null);
  }

  

  const getCatAttribute = (attributeName) => {
    const currentCat = getCurrentCat();
    if (!currentCat || !currentCat.breeds || currentCat.breeds.length === 0) {
      return 'Unknown';
    }
    
    const breed = currentCat.breeds[0];
    switch(attributeName) {
      case 'breed':
        return breed.name || 'Unknown';
      case 'weight':
        return breed.weight?.metric ? breed.weight.metric + ' kg' : 'Unknown';
      case 'origin':
        return breed.origin || 'Unknown';
      case 'description':
        return breed.description || 'No description available';
      default:
        return 'Unknown';
    }
  }

  const banAttribute = (attribute) => {

    if (bannedAttributes.includes(attribute)) {
      console.log(`Attribute ${attribute} is already banned.`);
      unbanAttribute(attribute);
      return;
    }
    setBannedAttributes(prevBanned => [...prevBanned, attribute]);
    console.log(`Banned attribute: ${attribute}`);
  }

  const unbanAttribute = (attributeToRemove) => {
    setBannedAttributes(prevBanned => 
      prevBanned.filter((index) => 
        index !== prevBanned.indexOf(attributeToRemove)
      )
    );
    console.log(`Unbanned attribute: ${attributeToRemove}`);
  }

  return (
    <>
      <div className='main-container'>
        <div className='cats-seen'>
          <h1>Cats Seen</h1>
          <p>List of cats seen</p>
          <button onClick={() => setCats([])}>Clear List</button>
          <ul>
            {cats.map((cat, index) => (
              <button onClick={() => setCurrentCat(cat)} key={index}>
                <img className='cat-image' src={cat.url} alt={`Cat ${index + 1}`} />
              </button>
            ))}
          </ul>
        </div>

        <div className='main-content'>
          <h1>Cat Finder</h1>
          <button onClick={getCats}>
            {loading ? 'Loading...' : 'Get Cat Image'}
          </button>
          {cats.length > 0 && (
            <div>
              <h2>Random Cat Image:</h2>
              <img className='cat-image' src={getCurrentCat().url} alt="Random Cat" />
              <div>
                {['breed', 'weight', 'origin'].map((attribute) => (
                  <button 
                    key={attribute}
                    className={`cat-${attribute}`} 
                    onClick={() => banAttribute(getCatAttribute(attribute))}
                  >
                    {attribute.charAt(0).toUpperCase() + attribute.slice(1)}: {getCatAttribute(attribute)}
                  </button>
                ))}
                <p>Description: {getCatAttribute('description')}</p>
              </div>
            </div>
          )}
        </div>

        <div className='ban-list'>
          <h1>Ban List</h1>
          <p>Click to unban</p>
          <div className='banned-items'>
            {bannedAttributes.map((attribute, index) => (
              <button 
                key={index}
                className='banned-attribute'
                onClick={() => unbanAttribute(attribute)}
              >
                {attribute} ✕
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App

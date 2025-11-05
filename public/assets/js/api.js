
async function apiFetch(endpoint, method, body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, options);
        
        const data = await response.json();

        if (!response.ok) {
  
            throw data; 
        }

        return data; 

    } catch (error) {
        console.error('Error en apiFetch:', error);
        throw error; 
    }
}
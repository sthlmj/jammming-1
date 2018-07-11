let accessToken;
const clientID = '132f3979b8e5486f95c498a645f3a7d9';
const redirectURI = 'http://playlist-rc.surge.sh/';

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    } else {
      // get access token
      const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
      const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
      if (accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1];
        const expiresIn = parseInt(expiresInMatch[1], 10);
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        return accessToken;
      }
      else {
        // Need to set response type to playlist-modify-private in order to create the playlist
        window.location = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-private&redirect_uri=${redirectURI}`;
      }
    }
  },

  search(term) {
    // get access token
    accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
    }).then(jsonResponse => {
        // get tracks from item list
        if (jsonResponse.tracks.items) {
          return jsonResponse.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
          }));
        } else {
          // no track returned
          return [];
        }
    });
  },

  saveplaylist(playlistName, trackURIs) {
    const accessToken = Spotify.getAccessToken();
    const headers = {Authorization: `Bearer ${accessToken}`};
    let userID = '';
    let playlistID ='';
    let snapshotID = '';

    if (playlistName !=='' && trackURIs!=='') {
      //get userID from spotify through spotify API
      return fetch(`https://api.spotify.com/v1/me`, {headers: headers}
      ).then(response => {
//        debugger
        if (response.ok) {
          return response.json();
        }
        else {
          console.log('failed get userID');
        }
      }).then(jsonResponse => {
        if (jsonResponse.id) {
          userID = jsonResponse.id;
        }
        // create a new playlist through spotify API
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`,
          {headers: headers, method: 'POST', body: JSON.stringify({name: playlistName})}
        ).then(response => {
//          debugger
          if (response.ok) {
            return response.json();
          }
          else {
            console.log('failed create new playlist');
          }
        }).then(jsonResponse => {
//           debugger
          if (jsonResponse.id) {
            playlistID = jsonResponse.id;
          }
          //add uris to the new playlist through spotify API
          return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`,
        {headers: headers, method: 'POST', body: JSON.stringify({uris: trackURIs})});
       });
     });
   }
 }
};

export default Spotify
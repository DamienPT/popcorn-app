// Fix for https://github.com/visionmedia/superagent/issues/95
var mdb = require('moviedb')(vendorAPIs.themoviedb.key),
    POSTER_PREFIX = 'http://image.tmdb.org/t/p/w342/',
    last = +new Date();

App.findMovieInfo = function (imdbId, callback) {
    var doRequest = function () {
        // 1 sec because limit is 3 calls every second, and we need to use 2.
        if (last > +new Date() - 1000) {
            return setTimeout(function () {
                App.findMovieInfo(imdbId, callback);
            }, new Date() - last + 1000);
        }

        last = +new Date();

        var findInfo = function (id) {
            mdb.movieInfo({
                id: id
            }, function (err, data) {
                if (!err && data) {
                    var info = {
                        image:      POSTER_PREFIX + data.poster_path,
                        overview:   data.overview,
                        title:      data.title,
                        voteAverage:data.vote_average,
                        runtime:    data.runtime
                    };

                    console.log('Fetched info for', imdbId, ':', info);

                    // Save to cache
                    App.Cache.setItem('tmdb', imdbId, info);

                    // Return callback call
                    callback(info);
                }
            });
        };

        // Find internal tMDB ID
        mdb.find({
            id: 'tt' + imdbId,
            external_source: 'imdb_id'
        }, function (err, data) {
            if (data && data.movie_results && data.movie_results.length) {
                findInfo(data.movie_results[0].id);
            }
        });
    };
    
    App.Cache.getItem('tmdb', imdbId, function (cachedItem) {
        if (cachedItem) {
            callback(cachedItem);
        } else {
            doRequest();
        }
    });
};
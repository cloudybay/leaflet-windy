
class WindyDataWorker {

    constructor(wind_layer, worker_uri) {
        this.wind_layer = wind_layer
        this.curr_uri = null

        if (worker_uri) {
            var self = this
            self.worker = new Worker(worker_uri)
            self.worker.onmessage = function (e) {
                if (e.data.fetched_data) {
                    if (e.data.uri == self.curr_uri) {
                        if (self.wind_layer) {
                            self.wind_layer.setData(e.data.fetched_data)
                        }
                    }
                }
            }
        }
    }

    rangeLayerData(uri) {
        var self = this
        self.curr_uri = uri
        if (uri) {
            if (self.worker) {
                self.worker.postMessage({
                    data_uri: uri
                })
            }
            else {
                WindyDataWorker.fetchData(uri, function(data) {
                    if (self.wind_layer) {
                        self.wind_layer.setData(data)
                    }
                })
            }
        }
        else {
            self.assignData(null)
        }
    }

    static strptime(date_str) {
        var _reg = new RegExp("(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})"),
            _rs = date_str.match(_reg),
            new_dt = new Date();

        new_dt.setFullYear(_rs[1])
        new_dt.setMonth(_rs[2])
        new_dt.setDate(_rs[3])
        new_dt.setHours(_rs[4])
        new_dt.setMinutes(_rs[5])
        new_dt.setSeconds(0)
        new_dt.setMilliseconds(0)
        return new_dt
    }

    static fetchData(uri, callback) {
        fetch(uri, {method: 'get'})
            .then(response => {
                if (response.ok) {
                    return Promise.resolve(response.json());
                }
                else {
                    return Promise.reject(new Error('Failed to load'));
                }
            })
            .then(data => {
                callback(data);
            })
            .catch(error => {
                callback({});
                console.log(`Error: ${error.message}`);
            })
    }
}


onmessage = function(e) {
    if (e.data.data_uri) {
        var callback = function(data) {
            postMessage({ fetched_data: data, uri: e.data.data_uri })
        }
        WindyDataWorker.fetchData(e.data.data_uri, callback)
    }
}

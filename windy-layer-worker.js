
class WindyDataProxy {

    constructor(wind_layer, worker_uri) {
        this.wind_layer = wind_layer
        if (worker_uri) {
            var self = this
            self.worker = new Worker(worker_uri)
            self.worker.onmessage = function (e) {
                if (e.data.fetched_data) {
                    self.assignData(e.data.fetched_data)
                }
                else if (e.data.transform_options) {
                    self.wind_layer.transformData(e.data.transform_options)
                }
            }
        }
    }

    assignData(data) {
        var self = this
        if (self.wind_layer.is_active()) {
            let from_data = self.wind_layer.data()
            if (from_data) {
                if (self.worker) {
                    self.worker.postMessage({
                        from_data: from_data,
                        to_data: data
                    })
                }
                else {
                    let transform_options = WindyDataProxy.interpolateData(from_data, data)
                    self.wind_layer.transformData(transform_options)
                }
                return self;
            }
        }
        self.wind_layer.setData(data)
        return self
    }

    goto_dtg(dtg) {
        var self = this
        if (self.worker) {
            self.worker.postMessage({
                data_uri: dtg
            })
        }
        else {
            WindyDataProxy.fetchData(dtg, function(data) {
                self.assignData(data)
            })
        }
    }

    static interpolateData(from_data, to_data) {
        // return { data:[], speed: int }
        var from_time = 0, to_time = 4,
            inter_datas = [], interp = 0

        if (from_data.refTime && to_data.refTime) {
            if (from_data.refTime == to_data.refTime) {
                interp = 0
            }
            else {
                interp = Math.abs(to_time - from_time)
            }
        }
        else {
            interp = Math.abs(to_time - from_time)
        }

        if (interp > 1) {
            let data_len = from_data.data[0].length

            for (let i=from_time; i<to_time; i++) {
                if (i == 0) {
                    inter_datas.push({header: from_data.header, data: from_data.data})
                    continue
                }

                let vdata = [], udata = [];
                for (let j=0; j<data_len; j++) {
                    let uf = from_data.data[0][j],
                        vf = from_data.data[1][j],
                        ut = to_data.data[0][j],
                        vt = to_data.data[1][j],
                        du = (ut - uf) / interp,
                        dv = (vt - vf) / interp;

                    udata.push(uf + (du * i))
                    vdata.push(vf + (dv * i))
                }

                inter_datas.push({
                    header: to_data.header,
                    data: [udata, vdata]
                })
            }
        }
        inter_datas.push({header: to_data.header, data: to_data.data})

        return { data: inter_datas, speed: (1.0 / interp)}
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
            .catch(function(error) {
                console.log(`Error: ${error.message}`);
            }
        )
    }
}


onmessage = function(e) {
    if (e.data.data_uri) {
        var callback = function(data) {
            postMessage({ fetched_data: data })
        }
        WindyDataProxy.fetchData(e.data.data_uri, callback)
    }
    else if (e.data.from_data && e.data.to_data) {
        let data_options = WindyDataProxy.interpolateData(e.data.from_data, e.data.to_data)
        postMessage({ transform_options: data_options })
    }
}

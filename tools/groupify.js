import axios from 'axios';

function run() {
    const { createApp, ref } = Vue

    const github_api = {
        get_plugins: "https://api.github.com/repos/mod-audio/mod-lv2-data/git/trees/master?recursive=1",
    }

    createApp({
        setup() {
            let plugins = ref([])
            let selected_plugin = ref(null)
            let selected_ttl = ref('')
            let err = ref(null)
            let ports = ref([])
            const groups = ref([])
            
            function get_plugin_list() {
                plugins.value = []
                axios.get(github_api.get_plugins)
                .then(res => {
                    for(const item of res.data.tree) {
                        const path = item["path"]

                        if ((path?.startsWith('plugins/') || path?.startsWith('plugins-fixed/'))) {
                            console.log(item)
                            if (path?.endsWith('/manifest.ttl')) {
                                const id = path.replace('/manifest.ttl', '')
                                const parentItem = plugins.value.find(element => element.id == id)
                                parentItem.manifest = item;
                            } else if (item["mode"] == '040000' && path.indexOf('/modgui') == -1 ) { // folder
                                var label = path.replace(/^.*[\\/]/, '')
                                plugins.value.push({id: path, label: label, selected: false, data: item, manifest: null})
                            }
                        }
                    }

                    plugins.value.sort((a,b) => {
                        return a.label.localeCompare(b.label)
                    })

                })
                .catch(err => {
                    console.error('error getting plugins: ', err)
                });
            }

            function select_plugin(id) {
                console.log('plugin selected', id)
                for(const plugin of plugins.value) {
                    plugin.selected = (plugin.id == id)
                    if (plugin.selected) {
                        selected_plugin.value = plugin 
                    }
                }

                if (selected_plugin.value) {
                    download_plugin_info(selected_plugin.value)
                }
            }

            function download_plugin_info(plugin) {
                console.log('download plugin info: ', plugin.id)

                // download manifest.ttl
                axios.get(plugin.manifest.url)
                .then(res => {
                    console.log('manifest.ttl downloaded ', res)
                    // parse manifest ttl
                    const manifest = atob(res.data.content)
                    console.log('manifest ', manifest)
                    const parser = new N3.Parser()
                    const quads = parser.parse(manifest)

                    // search the first quad which is a lv2:plugin and get the subject
                    let subject = null

                    for(const quad of quads) {
                        if (quad._object.id == "http://lv2plug.in/ns/lv2core#Plugin") {
                            subject = quad._subject.id
                            break;
                        }
                    }

                    // search the first quad seeAlso for the subject and get the plugin ttl
                    let pluginTtl = null
                    if (subject) {
                        for(const quad of quads) {
                            if (quad._object.id == "modgui.ttl" || quad._object.id == "modguis.ttl")
                                continue; // skip know ttl

                            if (quad._subject.id == subject && quad._predicate.id.endsWith("#seeAlso")) {
                                pluginTtl = quad._object.id
                                // cleanup

                            }
                        }
                    }
                    // download plugin ttl
                    if (pluginTtl) {
                        console.log('downloading ', plugin, pluginTtl)
                        // get the folder list

                        selected_ttl.value = ''
                        ports.value = []

                        axios.get(plugin.data.url)
                        .then(res => {
                            if (res?.data?.tree) {
                                for(var item of res.data.tree) {
                                    console.log(item)
                                    if (item.path == pluginTtl) {
                                        // found the ttl
                                        axios.get(item.url)
                                        .then(res => {
                                            selected_ttl.value = atob(res.data.content)
                                            // parse the ports
                                            const quads = parser.parse(selected_ttl.value)
                                            let subjects = new Set()

                                            // distinct subject
                                            for(let quad of quads) {
                                                if (!subjects.has(quad._subject.id))
                                                    subjects.add(quad._subject.id)
                                            }

                                            // subject that are inputports and control ports
                                            const getInputPort = function(id, q) {
                                                if (q._subject.id == id
                                                    && q._predicate.id.endsWith('#type')
                                                    && q._object.id.endsWith('#InputPort'))
                                                    return q
                                                else
                                                    return null
                                            } 
                                            const getControlPort = function(id, q) {
                                                if (q._subject.id == id
                                                    && q._predicate.id.endsWith('#type')
                                                    && q._object.id.endsWith('#ControlPort'))
                                                    return q
                                                else
                                                    return null
                                            } 
                                            const searchPredicate = function(id, q, predicate) {
                                                if (q._subject.id == id
                                                    && q._predicate.id == predicate)
                                                    return q
                                                else
                                                    return null
                                            } 

                                            for(let id of subjects) {
                                                if (quads.find(qd => getControlPort(id, qd)) && quads.find(qd => getInputPort(id, qd))) {
                                                    const label = quads.find(qd => searchPredicate(id, qd, "http://lv2plug.in/ns/lv2core#name"))
                                                    const symbol = quads.find(qd => searchPredicate(id, qd, "http://lv2plug.in/ns/lv2core#symbol"))

                                                    const port = {id: id, label: label?._object?.id.replace('"', '').replace('"', ''), symbol: symbol?._object.id, group: -1, selected: false}
                                                    ports.value.push(port)
                                                    console.log('added ', port)
                                                }
                                            }
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                        break
                                    }
                                }
                            }
                        })
                        .catch(err => {
                            console.log(err)
                        })
                    }
                })
                .catch(err => {
                    console.error('error getting plugins: ', err)
                })
            }

            function toggle_port_selection(portId) {
                console.log('toggle port selection ', portId)
                const port = ports.value.find(item => item.id == portId)

                if (port)
                    port.selected = !port.selected
            }

            function set_selected_port_group(group) {
                console.log('set_selected_port_group ', group)
                for(let port of ports.value) {
                    if (port.selected) {
                        port.group = group
                        port.selected = false
                    }
                }
            }

            // initalize groups
            groups.value.push({id: -1, label: 'none', color: "white"})
            for(let i=0; i<32; i++) {
                groups.value.push({id: i, label: (i+1).toString(), color: "red"})
            }
            return {
                selected_plugin,
                plugins,
                err,
                selected_ttl,
                ports,
                groups,
                toggle_port_selection,
                set_selected_port_group,
                get_plugin_list,
                select_plugin
            }
        },

    }).mount('#app')
}

export default { run }
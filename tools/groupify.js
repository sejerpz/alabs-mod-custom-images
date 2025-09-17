import axios from 'axios'

function run() {
    const storageKeyPlugins = 'groupify.v1.plugins';
    const github_api = {
        get_plugins: "https://api.github.com/repos/mod-audio/mod-lv2-data/git/trees/master?recursive=1",
    }
    const { createApp, ref, onMounted, watch } = Vue

    const app = createApp({
        setup() {
            let plugins = ref([])
            let selected_plugin = ref(null)
            let ttl_preview = ref('')
            let original_ttl = ''
            let patched_ttl = ''
            let err = ref(null)
            let ports = ref([])
            const groups = ref([])
            const el = ref<HTMLElement | null>(null)

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
                                plugins.value.push({id: path, label: label, data: item, manifest: null})
                            }
                        }
                    }

                    plugins.value.sort((a,b) => {
                        return a.label.localeCompare(b.label)
                    })

                    localStorage.setItem(storageKeyPlugins, JSON.stringify(plugins.value))
                })
                .catch(err => {
                    console.error('error getting plugins: ', err)
                });
            }

            function select_plugin(id) {
                console.log('plugin selected', id)
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

                        ttl_preview.value = original_ttl = ''
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
                                            ttl_preview.value = original_ttl = atob(res.data.content)
                                            // parse the ports
                                            const quads = parser.parse(original_ttl )
                                            let subjects = new Set()

                                            // distinct subject
                                            for(let quad of quads) {
                                                if (!subjects.has(quad._subject.id))
                                                    subjects.add(quad._subject.id)
                                            }

                                            // subject that are inputports and control ports
                                            const getInputPort = function(id, q) {
                                                if (q.subject.id == id
                                                    && q.predicate.id.endsWith('#type')
                                                    && q.object.id.endsWith('#InputPort'))
                                                    return q
                                                else
                                                    return null
                                            } 
                                            const getControlPort = function(id, q) {
                                                if (q._subject.id == id
                                                    && q.predicate.id.endsWith('#type')
                                                    && q.object.id.endsWith('#ControlPort'))
                                                    return q
                                                else
                                                    return null
                                            } 
                                            const searchPredicate = function(id, q, predicate) {
                                                if (q.subject.id == id
                                                    && q.predicate.id == predicate)
                                                    return q
                                                else
                                                    return null
                                            } 

                                            let _ports = []
                                            for(let id of subjects) {
                                                if (quads.find(qd => getControlPort(id, qd)) && quads.find(qd => getInputPort(id, qd))) {
                                                    const label = quads.find(qd => searchPredicate(id, qd, "http://lv2plug.in/ns/lv2core#name"))
                                                    const symbol = quads.find(qd => searchPredicate(id, qd, "http://lv2plug.in/ns/lv2core#symbol"))
                                                    const index =  quads.find(qd => searchPredicate(id, qd, "http://lv2plug.in/ns/lv2core#index"))

                                                    const port = { id: id,
                                                                   label: label?.object?.id.replace('"', '').replace('"', ''),
                                                                   symbol: symbol?.object.id.replace('"', '').replace('"', ''),
                                                                   index: parseInt(index.object.value) ?? 0,
                                                                   group: -1,
                                                                   selected: false
                                                                 }
                                                    _ports.push(port)
                                                    console.log('added ', port)
                                                }
                                            }

                                            // sort ports
                                            _ports.sort((a, b) => {
                                                if (a.index == b.index)
                                                    return 0
                                                else if (a.index < b.index)
                                                    return -1
                                                else
                                                    return 1
                                            });

                                            // all done
                                            ports.value = _ports;
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

            function on_port_dropped(e) {
                const p1 = ports.value[e.oldIndex]
                const p2 = ports.value[e.newIndex]
                const tmp = p1.index

                console.log('port dropped ', e, ' ', p1.index, ' <> ', p2.index)
                p1.index = p2.index
                p2.index = tmp
                console.log("new status ", ports.value)
            }

            function serialize()
            {
                // the patching is manual, can't reuse N3 too complex
                const lines = original_ttl.split('\n')

                const updateLineValue = (lines, lineIndex, name, newValue) => {
                    const toks = lines[lineIndex].split(' ')
                    let newLine = ""
                    let skipNext = false

                    for(const tok of toks) {
                        if (tok == '') {
                            newLine += ' '
                            continue;
                        }

                        if (skipNext) {
                            if (tok.endsWith(';')) // preserve the line ending even if we've skipped the value
                                newLine += ';'
                            skipNext = false
                        } else {
                            newLine += tok
                            if (tok.indexOf(':' + name) >= 0) {
                                newLine += ' ' + newValue
                                skipNext = true
                            }
                        }
                    }

                    return newLine
                }
                const patchPort = (patchInfo) => {
                    const port = patchInfo.port
                    const lines = patchInfo.lines
                    const indexLineIndex = patchInfo.indexLineIndex
                    const groupLineIndex = patchInfo.groupLineIndex
                    const symbolLineIndex = patchInfo.symbolLineIndex
                    const symbolPrefix = patchInfo.symbolPrefix
                    const indentation = patchInfo.symbolIndentation ?? '    '
                    const group = groups.value.find(item => item.id == port.group)

                    // ok new port found, add the config to the previous
                    if (indexLineIndex >= 0) {
                        // fix the index
                        lines[indexLineIndex] = updateLineValue(lines, indexLineIndex, 'index', port.index)
                    } else {
                        lines.splice(symbolLineIndex, 0, indentation + symbolPrefix + ':index ' + port.index.toString() + ';')
                    }
                    if (group.id == -1) {
                        // remove group
                        if (groupLineIndex >= 0)
                            lines.splice(groupLineIndex, 1)
                    } else {

                        if (groupLineIndex >= 0) {
                            // fix the index
                            lines[groupLineIndex] = updateLineValue(lines, groupLineIndex, 'group', group.name)
                        } else {
                            lines.splice(symbolLineIndex, 0, indentation + 'pg:group ' + group.name + ' ;')
                        }
                    }
                }

                let port = undefined
                let indexLineIndex = -1
                let symbolLineIndex = -1
                let symbolPrefix = ""
                let symbolIndentation = '    '
                let groupLineIndex = -1
                let lastPrefixIndex = -1
                let pluginId = null
                const usedGroupsId = []

                for(port of ports.value) {
                    let insidePort = 0

                    indexLineIndex = -1
                    symbolLineIndex = -1
                    symbolPrefix = ""
                    symbolIndentation = '    '
                    groupLineIndex = -1
                    lastPrefixIndex = -1

                    if (port.group >= 0 && !usedGroupsId.includes(port.group))
                        usedGroupsId.push(port.group)

                    for(let index = 0;index < lines.length; index++) {
                        const line = lines[index]

                        // search the plugin id (can't be on the first row)
                        if (pluginId == null && index > 0 && line.indexOf(':Plugin') >= 0)
                            pluginId = lines[index-1]
                        if (lastPrefixIndex == -1 && line.indexOf('@prefix ') >= 0)
                            lastPrefixIndex = index

                        if (line.indexOf(':port') >= 0) {
                            // ok new port found, add the config to the previous
                            if (symbolLineIndex >= 0) {
                                patchPort({
                                    port: port,
                                    lines: lines,
                                    indexLineIndex: indexLineIndex,
                                    groupLineIndex: groupLineIndex,
                                    symbolLineIndex: symbolLineIndex,
                                    symbolPrefix: symbolPrefix,
                                    symbolIndentation: symbolIndentation
                                })
                            }
                            insidePort = 0 // start of port descriptor
                            indexLineIndex = -1
                            symbolLineIndex = -1
                            symbolPrefix = ""
                            groupLineIndex = -1
                        }

                        if (insidePort < 2) { // finding a control input port port
                            if (line.indexOf(':ControlPort') >= 0)
                                insidePort++ // we need to find controlport and inputport
                            if (line.indexOf(':InputPort') >= 0)
                                insidePort++ // we need to find controlport and inputport

                        } else {
                            if (line.indexOf(':index') >= 0)
                                indexLineIndex = index
                            else if (line.indexOf(':symbol') >= 0)
                            {
                                // parse symbol name
                                let lineSymbolName = line.trim().split(' ')[1]?.replace('"', '').replace('"', '')
                                
                                console.log('line symbol: ', lineSymbolName)
                                if (lineSymbolName == port.symbol) {
                                    symbolLineIndex = index
                                    symbolPrefix = line.split(':')[0]?.trim() ?? ""
                                    symbolIndentation = line.replace(line.trim(), '')
                                }
                            } else if (line.indexOf(':group') >= 0) {
                                groupLineIndex = index
                            }

                        }
                    }
                }

                // if indexSymbolLine >= 0 we are handling the last port
                if (symbolLineIndex >= 0) {
                    patchPort({
                        port: port,
                        lines: lines,
                        indexLineIndex: indexLineIndex,
                        groupLineIndex: groupLineIndex,
                        symbolLineIndex: symbolLineIndex,
                        symbolPrefix: symbolPrefix,
                        symbolIndentation: symbolIndentation
                    })
                }


                // insert group extension prefix
                lastPrefixIndex++
                lines.splice(lastPrefixIndex, 0, '@prefix pg: <http://lv2plug.in/ns/ext/port-groups#> .')

                // add the groups
                if (usedGroupsId.length > 0) {
                    lines.push('')

                    for(let groupId of usedGroupsId) {
                        const group = groups.value.find(item => item.id == groupId)

                        if (group) {
                            lines.push(`${pluginId}:${group.name}`)
                            lines.push(`    a pg:InputGroup ;`)
                            lines.push(`    pg:symbol "${group.name}" ;`)
                            lines.push(`    pg:name "${group.label}" .`)
                        }
                    }
                }
                // join the lines
                patched_ttl = lines.join('\n')
                ttl_preview.value = patched_ttl
            }

            function switchPreview(preview) {
                console.log('switch preview ', preview)
                if (preview == 'patched')
                    ttl_preview.value = patched_ttl
                else if (preview == 'diff') {
                    ttl_preview.value = diff.createTwoFilesPatch("original", "new", original_ttl, patched_ttl)
                }
                else
                    ttl_preview.value = original_ttl
            }

            onMounted(() => {
                console.log("onMounted: from composition")
                let items = null

                try {
                    items = JSON.parse(localStorage.getItem(storageKeyPlugins));
                } catch(err) {
                    console.error('error reading local storage: ', err)
                    localStorage.setItem(storageKeyPlugins, null)
                    items = null
                }

                if (items && items.length > 0) {
                    console.log("plugins found in localstorage #", items.length)
                    plugins.value = items
                }

            })

            watch(select_plugin, (old, newValue) => {
                console.log('selected plugin ', newValue)
                select_plugin (newValue?.id)
            })
            // initalize groups
            groups.value.push({id: -1, label: 'none', name: '<#none#>', color: "white"})
            for(let i=0; i<32; i++) {
                groups.value.push({id: i, label: (i+1).toString(), name: 'GROUP_' + (i+1).toString(), color: "red"})
            }
            return {
                selected_plugin,
                plugins,
                err,
                ttl_preview,
                ports,
                groups,
                el,
                toggle_port_selection,
                set_selected_port_group,
                get_plugin_list,
                select_plugin,
                on_port_dropped,
                serialize,
                switchPreview
            }
        }
    })
    

    app.use(PrimeVue.Config, {
        theme: {
            preset: PrimeUIX.Themes.Aura
        }
    });

    app.component('p-toolbar', PrimeVue.Toolbar);
    app.component('p-button', PrimeVue.Button);
    app.component('p-listbox', PrimeVue.Listbox);
    app.component('p-splitter', PrimeVue.Splitter);
    app.component('p-splitterpanel', PrimeVue.SplitterPanel);

    app.component("draggable", VueDraggableNext.VueDraggableNext)
    app.mount('#app')
}

export default { run }
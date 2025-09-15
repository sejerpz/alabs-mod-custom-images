import axios from 'axios';

function run() {
    const { createApp, ref } = Vue

    const github_api = {
        get_plugins: "https://api.github.com/repos/mod-audio/mod-lv2-data/git/trees/master?recursive=1",
    }

    createApp({
        setup() {
            const message = ref('Hello vue!')

            function get_plugin_list() {

                axios.get(github_api.get_plugins)
                .then(res => {
                    for(let key in res.data.tree) {
                        const item = res.data.tree[key]

                        if (item["path"]?.startsWith('plugins/') && item["path"]?.endsWith('/manifest.ttl')) {
                            console.log(item)
                        }
                    }

                })
                .catch(err => {
                    console.error('error getting plugins: ', err)
                });
            }

            // 
            return {
                message,
                get_plugin_list
            }
        },

    }).mount('#app')
}

export default { run }
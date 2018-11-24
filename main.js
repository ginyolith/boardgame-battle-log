// Preparing for Firebase
const config = firebaseConfig;

firebase.initializeApp(config);

const db = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
db.settings(settings);

const collection_logs = db.collection("logs");
const collection_users = db.collection("users");

// Preparing Vue.js
const app = new Vue({
    el : '#app',
    data : {
        debugMode: true,
        currentUser : {
            id : '',
            name : ''
        },
        users : [],
        logs : []
    },

    mounted : () => {
        // define functions
        const insertLogs = function(querySnapshot) {
            const insertLog = function(change) {
                const log = change.doc.data()
                const date = new Date(null)

                date.setTime(log.time.seconds * 1000)
                log.time = date

                app.$data.logs.push(log)
            }

            querySnapshot.docChanges().forEach(insertLog)
        }

        const insertUsers = function(querySnapshot) {
            const insertUser = (doc) => {
                const user = {
                    name : doc.data().name,
                    id : doc.id
                }

                app.$data.users.push(user)
            }

            const deleteUser = (doc) => {
                app.$data.users.forEach((user, index) => {
                    if (doc.id === user.id) {
                        app.$data.users.splice(index, 1)
                    }
                })
            }

            querySnapshot.docChanges().forEach((change) => {
                const type = change.type
                if (type === 'added') {
                    insertUser(change.doc)
                } else if (type === 'removed') {
                    deleteUser(change.doc)
                }
            })
        }

        // add listeners
        collection_logs.onSnapshot(insertLogs)
        collection_users.onSnapshot(insertUsers)
    },

    methods : {
        addUser : function () {
            if (this.currentUser.name === '') {
                return
            }

            collection_users.add(this.currentUser)

            // IDと名前を初期化
            this.currentUser.id = ''
            this.currentUser.name = ''
        },

        deleteUser : (user) => {
            if (user.id ==='') {
                return
            }

            collection_users.doc(user.id).delete()
        },

        addBattleLog : function () {
            if (this.users.length === 0) {
                return
            }

            const log = {
                time : new Date(),
                users: []
            }

            this.users.forEach( (user) => {
                if (user.point == null) {
                    alert("Input names of all users before submit a log")
                    return
                }

                const one = {
                    name : user.name,
                    point : user.point
                }

                log.users.push(one)
            })

            this.logs.push(log)

            collection_logs.add(log)

            this.users.forEach( (user) => {
                user.point = null;
            })
        },

        renderResult : function(log) {
            if (log.users == null) {
                return
            }

            return log.users.map((value) => {
                return `${value.name}:${value.point} points`
            }).join(" / ")
        }
    }
})
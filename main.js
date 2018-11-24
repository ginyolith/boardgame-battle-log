// Preparing for Firebase
const config = ;

firebase.initializeApp(config);

const db = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
db.settings(settings);

const collection = db.collection("boardgame-battle-log");

// Preparing Vue.js
const app = new Vue({
    el : '#app',
    data : {
        dabug: false,
        currentName : '',
        users : [],
        logs : []
    },

    mounted : function() {
        collection.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const log = doc.data()
                const date = new Date(null)

                date.setTime(log.time.seconds * 1000)
                log.time = date

                this.logs.push(log)
            });
        });
    },
    methods : {
        addName : function () {
            if (this.currentName === '') {
                return
            }

            const user = {
                name : this.currentName,
                point : null
            }

            this.users.push(user)
            this.currentName = ''
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

            collection.add(log)

            this.users.forEach(function (user) {
                user.point = null;
            })
        },

        renderResult : function(log) {
            return log.users.map(function(value) {
                return `${value.name}:${value.point} points`
            }).join(" / ")
        }
    }
})
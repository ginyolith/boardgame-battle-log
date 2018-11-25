// Preparing for Firebase
const config = firebaseConfig;

firebase.initializeApp(config);

const db = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
db.settings(settings);

const collection_logs = db.collection("logs");
const collection_users = db.collection("users");
const collection_cards = db.collection("cards");

// Preparing Vue.js
const app = new Vue({
    el : '#app',
    data : {
        debugMode: true,
        currentUser : {
            id : '',
            name : ''
        },
        addToCardUser : null,
        editingCard : null,
        users : [],
        logs : [],
        cards : []
    },

    mounted : () => {
        // define functions
        const insertLogs = function(querySnapshot) {
            querySnapshot.docChanges().forEach((change) => {
                const log = change.doc.data()
                const date = new Date(null)

                date.setTime(log.time.seconds * 1000)
                log.time = date

                app.$data.logs.push(log)
            })
        }

        const insertUsers = function(querySnapshot) {
            querySnapshot.docChanges().forEach((change) => {
                // initialize
                const users = app.$data.users
                const type = change.type
                const doc = change.doc

                if (type === 'added') {

                    // Add user to local Observable fields
                    const user = {
                        name : doc.data().name,
                        id : doc.id
                    }

                    users.push(user)

                } else if (type === 'removed') {

                    // Delete user from local Observable fields
                    users.forEach((user, index) => {
                        if (doc.id === user.id) {
                            users.splice(index, 1)
                        }
                    })
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
        },

        createCard : function() {
            this.editingCard = new Card(this.users)
        },
        
        deleteCard : function () {
            this.editingCard = null
        },

        saveCard : function () {
            // save into firebase
            collection_cards.add(this.editingCard.asEntity())
            this.editingCard = null
        },

        deleteCardUser : function(user) {
            this.editingCard.removeUser(user)
        },

        addUserToCard: function () {
            this.editingCard.addUser(this.addToCardUser)
            this.addToCardUser = null
        }
    }
})

class Card {
    constructor(users) {
        this.title = '',
        this.users = []
        this.selectableUsers = []

        users.forEach((user) => {this.selectableUsers.push(user)})
    }

    addUser(added) {
        this.users.push(added)
        this.selectableUsers.forEach((user, index) => {
            if (user.id === added.id) {
                this.selectableUsers.splice(index, 1)
                return
            }
        })
    }

    removeUser(deleted) {
        this.users.forEach((user, index) => {
            if (user.id === deleted.id) {
                this.users.splice(index, 1)
                return
            }
        })

        this.selectableUsers.push(deleted)
    }

    asEntity() {
        return {
            title : this.title,
            users : this.users
        }
    }
}
// Preparing for Firebase
const config = firebaseConfig;

firebase.initializeApp(config);

const db = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
db.settings(settings);

const collection_logs = db.collection("logs")
const collection_users = db.collection("users")
const collection_cards = db.collection("cards")
const collection_titles = db.collection("title")

// Preparing Vue.js
const app = new Vue({
    el : '#app',
    data : {
        debugMode: true,
        currentUser : {
            id : '',
            name : ''
        },

        currentTitle : {
            id : '',
            name : ''
        },
        addToCardUser : null,
        editingCard : null,
        users : [],
        logs : [],
        cards : [],
        titles : []
    },

    mounted : () => {
        // define functions
        const insertLogs = function(querySnapshot) {
            querySnapshot.docChanges().forEach((change) => {
                const data = change.doc.data()
                const logs = app.$data.logs
                const type = change.type

                if (type === 'added') {
                    const date = new Date(null)
                    date.setTime(data.time.seconds * 1000)

                    const log = {
                        id : change.doc.id,
                        time : date,
                        users : data.users
                    }

                    logs.push(log)
                } else if (type === 'removed') {
                    // Delete user from local Observable fields
                    logs.forEach((log, index) => {
                        if (change.doc.id === log.id) {
                            logs.splice(index, 1)
                        }
                    })
                }

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

        const insertCards = (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                // initialize
                const cards = app.$data.cards
                const type = change.type
                const doc = change.doc

                if (type === 'added') {
                    // Add user to local Observable fields
                    const card = createCardByDoc(doc, app.$data.users)
                    cards.push(card)
                } else if (type === 'removed') {

                    // Delete user from local Observable fields
                    cards.forEach((user, index) => {
                        if (doc.id === user.id) {
                            cards.splice(index, 1)
                        }
                    })
                }
            })
        }

        const insertTitles = (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                // initialize
                const titles = app.$data.titles
                const type = change.type
                const doc = change.doc

                if (type === 'added') {

                    // Add title to local Observable fields
                    const title = {
                        name : doc.data().name,
                        id : doc.id
                    }

                    titles.push(title)

                } else if (type === 'removed') {

                    // Delete title from local Observable fields
                    titles.forEach((title, index) => {
                        if (doc.id === title.id) {
                            titles.splice(index, 1)
                        }
                    })
                }
            })
        }

        // add listeners
        collection_logs.onSnapshot(insertLogs)
        collection_users.onSnapshot(insertUsers)
        collection_cards.onSnapshot(insertCards)
        collection_titles.onSnapshot(insertTitles)
    },

    methods : {
        // User Master
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

        // Title Master
        addTitle : function () {
            if (this.currentTitle.name === '') {
                return
            }

            collection_titles.add(this.currentTitle)

            // IDと名前を初期化
            this.currentTitle.id = ''
            this.currentTitle.name = ''
        },

        deleteTitle : (title) => {
            if (title.id ==='') {
                return
            }

            collection_titles.doc(title.id).delete()
        },

        saveLog :  (card) => {
            if (card.users.length < 1) {
                return
            }

            const log = {
                time : new Date(),
                users: []
            }

            let isSavingLogSuccess = true

            card.users
                .sort((a, b) => {return b.point - a.point})
                .forEach( (user, index) => {
                if (user.point == null) {
                    alert("Input names of all users before submit a log")
                    isSavingLogSuccess = false
                    return
                }

                const one = {
                    rank : index + 1,
                    name : user.name,
                    point : user.point
                }

                log.users.push(one)
            })

            if (isSavingLogSuccess) {
                collection_logs.add(log)
                card.users.forEach( (user) => { user.point = null; })
            }
        },

        deleteLog : function(log) {
            collection_logs.doc(log.id).delete()
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
            this.editingCard = createEditableCard(this.users)
        },
        
        deleteCard : function (card) {
            collection_cards.doc(card.id).delete()
        },

        clearEditingCard : function() {
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
        },


    }
})

function createEditableCard(allUsers) {
    return new Card(
        '',
        '',
        allUsers,
        []
    )
}

function createCardByDoc(doc, allUsers) {
    const data = doc.data()
    if (data.title == null) {
        data.title = ''
    }

    if (data.users == null || data.users == undefined) {
        data.users = []
    }

    return new Card(
        doc.id,
        data.title,
        allUsers,
        data.users
    )
}

class Card {
    constructor(id, title, allUsers, selectedUsers) {
        this.id = id
        this.title = title
        this.users = selectedUsers
        this.selectableUsers = []

        const selectedUserIds = selectedUsers.map((elm) => {return elm.id})

        allUsers.forEach((user) => {
            // If the user is not selected...
            if (selectedUserIds.indexOf(user.id) < 0) {
                this.selectableUsers.push(user)
            }
        })
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
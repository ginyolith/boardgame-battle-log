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
        dialog : {
            card : false,
            user : false,
            title : false
        },
        drawer: true,
        debugMode: true,
        currentUser : {
            id : '',
            name : '',
        },

        currentUserShow : false,

        currentTitle : {
            id : '',
            name : ''
        },

        currentTitleShow : false,

        headers : {
            user : [
                {
                    text: '名前',
                    align: 'left',
                    sortable: false,
                    value: 'name'
                },
                { text: 'id', value: 'id' },
            ],
            title : [
                {
                    text: 'タイトル',
                    align: 'left',
                    sortable: false,
                    value: 'name'
                },
                { text: 'id', value: 'id' },
            ]
        },

        addToCardUser : null,
        editingCard : {
            title : {},
            users : []
        },
        users : [],
        logs : [],
        cards : [],
        titles : [],
        search : ''
    },

    props: {
        source: String
    },

    watch: {
        'editingCard.users' : {
            handler: function (val, oldVal) {
                const lastUser = val[val.length - 1];
                if (lastUser != null) {
                    if (lastUser.id == null || lastUser.id == undefined) {
                        val.splice(val.length - 1, 1)
                        this.search = lastUser
                    }
                }
            },
            deep: false
        }
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
                        users : data.users,
                        title : data.title

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
                        text : doc.data().name,
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
                        text : doc.data().name,
                        value : {
                            name : doc.data().name,
                            id : doc.id
                        }
                    }

                    titles.push(title)

                } else if (type === 'removed') {

                    // Delete title from local Observable fields
                    titles.forEach((title, index) => {
                        if (doc.id === title.value.id) {
                            titles.splice(index, 1)
                        }
                    })
                } else if (type == 'modified') {
                    titles.forEach((title, index) => {
                        if (doc.id === title.value.id) {
                            title.text = doc.data().name
                            title.value.id   = doc.id
                            title.value.name = doc.data().name
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

            if (this.currentUser.id == '') {
                collection_users.add(this.currentUser)
            } else {
                collection_users.doc(this.currentUser.id).set(this.currentUser)
            }

            // IDと名前を初期化
            this.currentUser = {
                id : '',
                name : ''
            }

            this.currentUserShow = false
        },

        deleteUser : (user) => {
            if (!confirm(`本当にユーザー ${user.name} を削除しますか？`)) {
                return
            }

            if (user.id ==='') {
                return
            }

            collection_users.doc(user.id).delete()
        },

        editUser : function(user) {
            if (user.id ==='') {
                return
            }

            this.currentUser = user
            this.currentUserShow = true
        },

        clearEditingUser : function() {
            this.currentUser.id = ''
            this.currentUser.name = ''
            this.currentUserShow = false
        },

        // Title Master
        addTitle : function () {
            if (this.currentTitle.name === '') {
                return
            }

            if (this.currentTitle.id == '') {
                collection_titles.add(this.currentTitle)
            } else {
                collection_titles.doc(this.currentTitle.id).set(this.currentTitle)
            }

            // IDと名前を初期化
            this.currentTitle = {
                id : '',
                name : ''
            }

            this.currentTitleShow = false
        },

        deleteTitle : (title) => {
            if (!confirm(`本当にタイトル ${title.name} を削除しますか？`)) {
                return
            }

            if (title.id ==='') {
                return
            }

            collection_titles.doc(title.id).delete()


        },

        editTitle : function(title) {
            if (title.id ==='') {
                return
            }

            this.currentTitle = title
            this.currentTitleShow = true
        },

        clearEditingTitle : function() {
            this.currentTitle.id = ''
            this.currentTitle.name = ''
            this.currentTitleShow = false
        },

        saveLog :  (card) => {
            if (card.users.length < 1) {
                return
            }

            const log = {
                time : new Date(),
                users: [],
                title : card.title
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

        toCardEditMode : function() {
            this.editingCard = createEditableCard(this.users)
            this.dialog.card = true
        },

        deleteCard : function (card) {
            if (!confirm(`本当にカードを削除しますか？`)) {
                return
            }

            collection_cards.doc(card.id).delete()
        },

        clearEditingCard : function() {
            this.editingCard = createEditableCard(this.users)
            this.dialog.card = false
        },

        saveCard : function () {
            for (const user of this.editingCard.users) {
                if (user.id == null || user.id == undefined) {
                    collection_users.add({
                        name : user,
                        id : ''
                    })
                }
            }

            // save into firebase
            collection_cards.add(this.editingCard.asEntity())

            this.editingCard = createEditableCard(this.users)
            this.dialog = false
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

        const selectedUserIds = selectedUsers.map(
            (elm) => {
                if (elm != null && elm != undefined) {
                    return elm.id
                }
            }
        )

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
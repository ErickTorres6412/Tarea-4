<!-- BookIndex.vue -->
<template>
  <div class="row">
   <div style="margin-top: 5%">
     <h2>{{title}}</h2>
     <div v-if="message" class="notice">{{message}}</div>
     <table class="u-full-width"><thead>
       <tr>
        <th>Title</th>
        <th>Autor</th>
        <th>Publisher</th>
        <th>Edition</th>
        <th class="text-center">Actions</th>
       </tr>
       </thead><tbody>
       <tr v-for='book in books' :key="book.id">
       <td>{{book.title}}</td>
       <td>{{book.author}}</td>
       <td>{{book.publisher}}</td>
       <td>{{book.edition}}</td>
       <td>
       <router-link class="button"
         :to="'/book/show/'+book.id">Show</router-link>
       &nbsp;
       <router-link class="button"
         :to="'/book/edit/'+book.id">Edit</router-link>
       &nbsp;
       <a class="button"
         v-on:click="deleteBook(book.id)">Erase</a>
       </td>
       </tr></tbody>
     </table>
     <router-link class="button button-primary"
       to="/book/create">New</router-link>
     &nbsp;
     <a class="button" v-on:click="runTasks()">Process queue (bookTasks)</a>
     &nbsp;
     <a class="button" v-on:click="allBooks()">Refresh</a>
   </div>
  </div>
</template>

<script>

export default {
  name: "Book Index",
  data() {
    return {
      title: 'Book List',
      books: [],
      message: this.$route.query.queued ?
        'The ' + this.$route.query.queued + ' request was sent to the queue. ' +
        'It will be applied when bookTasks is executed.' : ''
    };
  },
  mounted() {
    this.allBooks()
  },
  methods: {
    allBooks() {
      fetch(this.url+'/.netlify/functions/bookFindAll',
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((items) => {
          this.books = items;
        })
     },
     deleteBook(id) {
       fetch(this.url+'/.netlify/functions/bookDelete/'+id,
         { headers: {'Content-Type': 'application/json'},
           method: 'DELETE'})
          .then((response) => {
            this.message = response.ok ?
              'The delete request was sent to the queue. ' +
              'It will be applied when bookTasks is executed.' :
              'Error sending the delete request.';
            this.allBooks();
          }
        )
     },
     runTasks() {
       fetch(this.url+'/.netlify/functions/bookTasks')
         .then((response) => response.json())
         .then((result) => {
           this.message = 'bookTasks processed ' + result.processed + ' message(s).';
           this.allBooks();
         })
     }
  }
};
</script>

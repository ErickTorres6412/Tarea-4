<!-- AuthorIndex.vue -->
<template>
  <div class="row">
   <div style="margin-top: 5%">
     <h2>{{title}}</h2>
     <div v-if="message" class="notice">{{message}}</div>
     <table class="u-full-width"><thead>
       <tr>
        <th>Author</th>
        <th>Nationality</th>
        <th>Birth year</th>
        <th>Fields</th>
        <th class="text-center">Actions</th>
       </tr>
       </thead><tbody>
       <tr v-for='author in authors' :key="author.id">
       <td>{{author.author}}</td>
       <td>{{author.nationality}}</td>
       <td>{{author.birth_year}}</td>
       <td>{{author.fields}}</td>
       <td>
       <router-link class="button"
         :to="'/author/show/'+author.id">Show</router-link>
       &nbsp;
       <router-link class="button"
         :to="'/author/edit/'+author.id">Edit</router-link>
       &nbsp;
       <a class="button"
         v-on:click="deleteAuthor(author.id)">Erase</a>
       </td>
       </tr></tbody>
     </table>
     <router-link class="button button-primary"
       to="/author/create">New</router-link>
     &nbsp;
     <a class="button" v-on:click="runTasks()">Process queue (authorTasks)</a>
     &nbsp;
     <a class="button" v-on:click="allAuthors()">Refresh</a>
   </div>
  </div>
</template>

<script>

export default {
  name: "Author Index",
  data() {
    return {
      title: 'Author List',
      authors: [],
      message: this.$route.query.queued ?
        'The ' + this.$route.query.queued + ' request was sent to the queue. ' +
        'It will be applied when authorTasks is executed.' : ''
    };
  },
  mounted() {
    this.allAuthors()
  },
  methods: {
    allAuthors() {
      fetch(this.url+'/.netlify/functions/authorFindAll',
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((items) => {
          this.authors = items;
        })
     },
     deleteAuthor(id) {
       fetch(this.url+'/.netlify/functions/authorDelete/'+id,
         { headers: {'Content-Type': 'application/json'},
           method: 'DELETE'})
          .then((response) => {
            this.message = response.ok ?
              'The delete request was sent to the queue. ' +
              'It will be applied when authorTasks is executed.' :
              'Error sending the delete request.';
            this.allAuthors();
          }
        )
     },
     runTasks() {
       fetch(this.url+'/.netlify/functions/authorTasks')
         .then((response) => response.json())
         .then((result) => {
           this.message = 'authorTasks processed ' + result.processed + ' message(s).';
           this.allAuthors();
         })
     }
  }
};
</script>

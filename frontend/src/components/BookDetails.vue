<!-- BookDetails.vue -->
<template>
  <div class="row">
   <div class="eleven column" style="margin-top: 5%">
    <h2>{{title}}</h2>
     <form>
     <fieldset :disabled="show">
     <div class="row">
      <div class="six columns">
       <label for="titleInput">Title</label>
       <input id="titleInput" class="u-full-width" type="text"
         v-model="book.title">
      </div>
      <div class="six columns">
       <label for="authorInput">Author</label>
       <input id="authorInput" class="u-full-width" type="text"
          v-model="book.author">
      </div>
     </div>
     <div class="row">
      <div class="six columns">
       <label for="publisherInput">Publisher</label>
       <input id="publisherInput" class="u-full-width" type="text"
          v-model="book.publisher">
      </div>
      <div class="six columns">
       <label for="editionInput">Edition</label>
       <input id="editionInput" class="u-full-width" type="text"
         v-model="book.edition">
      </div>
     </div>
     <div class="row">
      <div class="four columns">
       <label for="copyrightInput">Copyright</label>
       <input id="copyrightInput" class="u-full-width" type="number"
          v-model.number="book.copyright">
      </div>
      <div class="four columns">
       <label for="languageInput">Language</label>
       <input id="languageInput" class="u-full-width" type="text"
         v-model="book.language">
      </div>
      <div class="four columns">
       <label for="pagesInput">Pages</label>
       <input id="pagesInput" class="u-full-width" type="number"
         v-model.number="book.pages">
      </div>
     </div>
     </fieldset>
     <div class="row">
      <router-link class="button button-primary"
        to="/book">Back</router-link>
       <a v-if='edit' class="button button-primary" style="float: right"
         v-on:click="updateBook(book.id)">Update</a>
       <a v-if='create' class="button button-primary" style="float: right"
         v-on:click="createBook()">Create</a>
     </div>
    </form>
  </div>
</div>
</template>

<script>
import { useRoute } from 'vue-router'

export default {
  name: "Book Details",
  props: ['show','edit','create'],
  data() {
    return {
      title: "Book Data",
      book: {}
    }
  },
  mounted() {
    const route = useRoute()
    if (route.params.id != null)
      this.findBook(route.params.id);
    else {
      this.book = {
        'id': Math.floor(Math.random()*100000000),'title':'','edition':'',
        'copyright':0,'language':'','pages':0,'author':'','author_id':0,
        'publisher':'','publisher_id':0 };
    }
  },
  methods: {
    findBook: function(id) {
      fetch(this.url+'/.netlify/functions/bookFind/'+id,
      { headers: {'Accept': 'application/json'}})
      .then((response) => response.json())
      .then((items) => {
       this.book = items[0];
      })
    },
    updateBook: function(id) {
      fetch(this.url+'/.netlify/functions/bookUpdate/'+id,
        { headers: {'Content-Type':'application/json'},
          method: 'PUT',
          body: JSON.stringify(this.book)})
        .then((data) => {
          this.$router.push('/book?queued=update');
        }
      )
    },
    createBook: function() {
      fetch(this.url+'/.netlify/functions/bookInsert',
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.book)})
        .then((data) => {
           this.$router.push('/book?queued=insert');
        }
      )
    }
  }
};
</script>

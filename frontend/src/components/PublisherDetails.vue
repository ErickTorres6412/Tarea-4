<!-- PublisherDetails.vue -->
<template>
  <div class="row">
   <div class="eleven column" style="margin-top: 5%">
    <h2>{{title}}</h2>
     <form>
     <fieldset :disabled="show">
     <div class="row">
      <div class="six columns">
       <label for="publisherInput">Publisher</label>
       <input id="publisherInput" class="u-full-width" type="text"
         v-model="publisher.publisher">
      </div>
      <div class="six columns">
       <label for="countryInput">Country</label>
       <input id="countryInput" class="u-full-width" type="text"
          v-model="publisher.country">
      </div>
     </div>
     <div class="row">
      <div class="six columns">
       <label for="foundedInput">Founded</label>
       <input id="foundedInput" class="u-full-width" type="number"
          v-model.number="publisher.founded">
      </div>
      <div class="six columns">
       <label for="genereInput">Genre</label>
       <input id="genereInput" class="u-full-width" type="text"
         v-model="publisher.genere">
      </div>
     </div>
     </fieldset>
     <div class="row" v-if="publisher.books && publisher.books.length">
      <label>Books</label>
      <ul>
        <li v-for="book in publisher.books" :key="book.book_id">
          <router-link :to="'/book/show/'+book.book_id">{{book.title}}</router-link>
        </li>
      </ul>
     </div>
     <div class="row">
      <router-link class="button button-primary"
        to="/publisher">Back</router-link>
       <a v-if='edit' class="button button-primary" style="float: right"
         v-on:click="updatePublisher(publisher.id)">Update</a>
       <a v-if='create' class="button button-primary" style="float: right"
         v-on:click="createPublisher()">Create</a>
     </div>
    </form>
  </div>
</div>
</template>

<script>
import { useRoute } from 'vue-router'

export default {
  name: "Publisher Details",
  props: ['show','edit','create'],
  data() {
    return {
      title: "Publisher Data",
      publisher: {}
    }
  },
  mounted() {
    const route = useRoute()
    if (route.params.id != null)
      this.findPublisher(route.params.id);
    else {
      this.publisher = {
        'id': Math.floor(Math.random()*100000000),'publisher':'',
        'country':'','founded':0,'genere':'','books':[] };
    }
  },
  methods: {
    findPublisher: function(id) {
      fetch(this.url+'/.netlify/functions/publisherFind/'+id,
      { headers: {'Accept': 'application/json'}})
      .then((response) => response.json())
      .then((items) => {
       this.publisher = items[0];
      })
    },
    updatePublisher: function(id) {
      fetch(this.url+'/.netlify/functions/publisherUpdate/'+id,
        { headers: {'Content-Type':'application/json'},
          method: 'PUT',
          body: JSON.stringify(this.publisher)})
        .then((data) => {
          this.$router.push('/publisher?queued=update');
        }
      )
    },
    createPublisher: function() {
      fetch(this.url+'/.netlify/functions/publisherInsert',
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.publisher)})
        .then((data) => {
           this.$router.push('/publisher?queued=insert');
        }
      )
    }
  }
};
</script>

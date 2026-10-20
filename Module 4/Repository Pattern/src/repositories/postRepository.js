const postStore = require('../data/postStore');

// Services depend on this interface, not on the storage implementation.
// To migrate to Prisma, replace the Map operations below with Prisma queries
// while keeping findAll, findById, create, update, and remove as the contract.
const posts = new Map(postStore.initialPosts.map((post) => [post.id, { ...post }]));
let nextId = Math.max(0, ...posts.keys()) + 1;

function findAll() {
  return Array.from(posts.values());
}

function findById(id) {
  return posts.get(Number(id)) || null;
}

function create(fields) {
  const post = {
    ...fields,
    id: nextId++,
  };

  posts.set(post.id, post);
  return post;
}

function update(id, patch) {
  const post = findById(id);
  if (!post) return null;

  const updatedPost = { ...post, ...patch, id: post.id };
  posts.set(updatedPost.id, updatedPost);
  return updatedPost;
}

function remove(id) {
  return posts.delete(Number(id));
}

module.exports = { findAll, findById, create, update, remove };

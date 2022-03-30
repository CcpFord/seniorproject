import express from 'express';
import controller from '../controllers/controller';
const router = express.Router();

router.get('/browse-book/:id/:page', controller.getBrowseBookByPage);
router.get('/get-all-book/:bookType', controller.getAllBook);
router.post('/search-book/', controller.getSearchBookByFilterPage);
router.post('/search-book-text/', controller.getSearchBookTextByFilterPage);
router.post('/compare-text/', controller.getCompareBookByFilter);

export = router;
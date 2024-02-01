var Rules = function(board)
{
  var scoring = false;

  this.prepareNewGame = function()
  {

    scoring = false;
    while (true)
    {
      this.populateBoard()
      var crushable = this.getCandyCrushes();
      if (crushable.length == 0) break;
      this.removeCrushes(crushable);
    }
    scoring = true;
  }
  this.isMoveTypeValid = function(fromCandy, direction)
  {
    return this.numberCandiesCrushedByMove(fromCandy, direction) > 0;
  }
  this.getCandyCrushes = function(swap) {
    var unioned = {};
    var sizes = {};
    var row, col;
    function find(key)
    {
      var parent = unioned[key];
      if (parent == null) return key;
      parent = find(parent);
      unioned[key] = parent;
      return parent;
    }
    function size(found)
    {
      return sizes[found] || 1;
    }
    function union(key1, key2)
    {
      var p1 = find(key1), p2 = find(key2);
      if (p1 == p2) return p1;
      unioned[p2] = p1;
      sizes[p1] = size(p1) + size(p2);
      delete sizes[p2];
    }
    var vert = this.findColorStrips(true, swap);
    var horiz = this.findColorStrips(false, swap);
    var sets = vert.concat(horiz);
    for (var j = 0; j < sets.length; j++)
    {
      var set = sets[j];
      for (var k = 1; k < set.length; k++)
      {
        union(set[0].id, set[k].id)
      }
    }
    var results = {}
    for (row = 0; row < board.boardSize; row++)
    {
      for (col = 0; col < board.boardSize; col++)
      {
        var candy = board.getCandyAt(row, col);
        if (candy)
        {
          var p = find(candy.id);
          if (size(p) >= 3)
          {
            if (!(p in results)) results[p] = [];
            results[p].push(candy);
          }
        }
      }
    }
    var list = [];
    for (var key in results)
    {
      list.push(results[key]);
    }
    return list;
  }
  this.removeCrushes = function(setOfSetsOfCrushes)
  {
    for (var j = 0; j < setOfSetsOfCrushes.length; j++)
    {
      var set = setOfSetsOfCrushes[j];
      for (var k = 0; k < set.length; k++)
      {
        if (scoring) board.incrementScore(set[k], set[k].row, set[k].col);
        board.remove(set[k]);
      }
    }
  }
  this.moveCandiesDown = function()
  {
    for (var col = 0; col < board.boardSize; col++)
    {
      var emptyRow = null;
      for (var emptyRow = board.boardSize - 1; emptyRow >= 0; emptyRow--)
      {
        if (board.getCandyAt(emptyRow, col) == null)
        {
          break;
        }
      }
      for (var row = emptyRow - 1; row >= 0; row--)
      {
        var candy = board.getCandyAt(row, col);
        if (candy != null)
        {
          board.moveTo(candy, emptyRow, col);
          emptyRow--;
        }
      }

      for (var spawnRow = -1; emptyRow >= 0; emptyRow--, spawnRow--)
      {
        board.addRandomCandy(emptyRow, col, spawnRow, col);
      }
      
    }
  }
  this.getRandomValidMove = function()
  {
    var directions = ['up', 'down', 'left', 'right'];
    var validMovesThreeCrush = [];
    var validMovesMoreThanThreeCrush = [];
    for (var row = 0; row < board.boardSize; row++)
    {
      for (var col = 0; col < board.boardSize; col++)
      {
        var fromCandy = board.getCandyAt(row,col);
        if (!fromCandy) continue;
        for (i = 0; i < 4; i++)
        {
          var direction = directions[i];
          var numCandiesCrushed =
              this.numberCandiesCrushedByMove(fromCandy, direction);
          if (numCandiesCrushed == 3)
          {
            validMovesThreeCrush.push({candy: fromCandy, direction: direction});
          }
          else if (numCandiesCrushed > 3)
          {
            validMovesMoreThanThreeCrush.push(
                {candy: fromCandy, direction: direction});
          }
        }
      }
    }
    var searchArray = validMovesThreeCrush.length ? validMovesThreeCrush :
      validMovesMoreThanThreeCrush;
    if (searchArray.length == 0) return null;
    return searchArray[Math.floor(Math.random() * searchArray.length)];
  }
  this.createSpecifiedBoard = function(boardSpec) {

    color_dict = {'r':'red', 'o':'orange', 'y':'yellow', 'g':'green','b':'blue','p':'purple'}

    var numChars=0;

    boardSpec.map(function (i) { return numChars+=i.length });
    if (boardSpec.length != board.boardSize || numChars != Math.pow(board.boardSize,2)){
      console.warn("boardSpec must be of dimensions boardSize x boardSize to populate board");
      return;
    }

    for (var col = 0; col < board.boardSize; col++)
    {
      for (var row = 0; row < board.boardSize; row++)
      {
        if (board.getCandyAt(row, col) == null)
        {
           var color = color_dict[boardSpec[row].charAt(col)];
           board.addCandy(color, row, col);
        }
      }
    }

  }
  this.populateBoard = function()
  {
    for (var col = 0; col < board.boardSize; col++)
    {
      for (var row = 0; row < board.boardSize; row++)
      {
        if (board.getCandyAt(row, col) == null)
        {
          board.addRandomCandy(row, col);
        }
      }
    }
  }
  this.numberCandiesCrushedByMove = function(fromCandy, direction)
  {
    return this.getCandiesToCrushGivenMove(fromCandy, direction).length;
  }
  this.getCandiesToCrushGivenMove = function(fromCandy, direction)
  {
    var toCandy = board.getCandyInDirection(fromCandy, direction);
    if (!toCandy || toCandy.color == fromCandy.color)
    {
      return [];
    }
    var swap = [fromCandy, toCandy];
    var crushable = this.getCandyCrushes(swap);
    var connected = crushable.filter(function(set)
    {
      for (var k = 0; k < swap.length; k++)
      {
        if (set.indexOf(swap[k]) >= 0) return true;
      }
      return false;
    });
    
    return [].concat.apply([], connected);
  }
  this.findColorStrips = function(vertical, swap) {
    var getAt = function(x, y)
    {
      var result = vertical ? board.getCandyAt(y, x) : board.getCandyAt(x, y);
      if (swap)
      {
        var index = swap.indexOf(result);
        if (index >= 0) return swap[index ^ 1];
      }
      return result;
    };
    var result = [];
    for (var j = 0; j < board.boardSize; j++)
    {
      for (var h, k = 0; k < board.boardSize; k = h)
      {
        var firstCandy = getAt(j, k);
        h = k + 1;
        if (!firstCandy) continue;
        var candies = [firstCandy];
        for (; h < board.boardSize; h++)
        {
          var lastCandy = getAt(j, h);
          if (!lastCandy || lastCandy.color != firstCandy.color) break;
          candies.push(lastCandy);
        }
        if (candies.length >= 3) result.push(candies);
      }
    }
    return result;
  }


}
